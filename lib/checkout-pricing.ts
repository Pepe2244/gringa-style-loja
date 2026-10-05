export interface CheckoutItem {
    produto_id: number;
    quantidade: number;
    variante?: { tipo: string; opcao: string } | null;
}

export interface PricedProduct {
    id: number;
    preco: number;
    preco_promocional: number | null;
    preco_pix: number | null;
    em_estoque: boolean;
}

export interface CouponForCheckout {
    codigo: string;
    ativo: boolean;
    data_validade: string | null;
    limite_uso: number | null;
    usos_atuais: number;
    metodo_pagamento_restrito: string | null;
    valor_minimo: number | null;
    tipo_aplicacao: string;
    produtos_aplicaveis: number[] | null;
    tipo_desconto: string | null;
    valor_desconto: number | null;
    tipo: string | null;
    valor: number | null;
}

export type PaymentMethod = 'pix' | 'cartao_credito';

export function normalizePaymentMethod(value: unknown): PaymentMethod {
    if (value == null || value === '') return 'cartao_credito';
    if (typeof value !== 'string') throw new Error('Método de pagamento inválido.');
    const normalized = value.toLowerCase().trim();
    if (normalized === 'pix') return 'pix';
    if (['cartão de crédito', 'cartao de credito', 'cartao_credito', 'credit_card'].includes(normalized)) {
        return 'cartao_credito';
    }
    throw new Error('Método de pagamento inválido.');
}

export function aggregateCartItems(items: unknown): CheckoutItem[] {
    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
        throw new Error('O carrinho deve conter entre 1 e 50 itens.');
    }

    const quantities = new Map<string, CheckoutItem>();
    for (const item of items) {
        if (
            !item || typeof item !== 'object' ||
            !Number.isSafeInteger(item.produto_id) || item.produto_id <= 0 ||
            !Number.isSafeInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > 99
        ) {
            throw new Error('Item ou quantidade inválida.');
        }

        let variant: CheckoutItem['variante'] = null;
        if (item.variante != null) {
            if (
                typeof item.variante !== 'object' ||
                typeof item.variante.tipo !== 'string' ||
                typeof item.variante.opcao !== 'string' ||
                !item.variante.tipo.trim() ||
                !item.variante.opcao.trim() ||
                item.variante.tipo.length > 100 ||
                item.variante.opcao.length > 100
            ) {
                throw new Error('Opção de produto inválida.');
            }
            variant = { tipo: item.variante.tipo.trim(), opcao: item.variante.opcao.trim() };
        }

        const key = JSON.stringify([item.produto_id, variant?.tipo ?? null, variant?.opcao ?? null]);
        const existing = quantities.get(key);
        const quantity = (existing?.quantidade || 0) + item.quantidade;
        if (quantity > 99) throw new Error('A quantidade por produto não pode exceder 99 unidades.');
        quantities.set(key, {
            produto_id: item.produto_id,
            quantidade: quantity,
            ...(variant ? { variante: variant } : {}),
        });
    }

    return Array.from(quantities.values());
}

export function getUnitPrice(product: PricedProduct, paymentMethod: PaymentMethod) {
    if (!Number.isFinite(product.preco) || product.preco < 0) {
        throw new Error(`Preço inválido para o produto ${product.id}.`);
    }

    const pixPrice = product.preco_pix;
    if (paymentMethod === 'pix' && pixPrice !== null && pixPrice > 0 && pixPrice < product.preco) {
        return pixPrice;
    }

    const promotionalPrice = product.preco_promocional;
    if (promotionalPrice !== null && promotionalPrice > 0 && promotionalPrice < product.preco) {
        return promotionalPrice;
    }

    return product.preco;
}

export function getCouponFailure(
    coupon: CouponForCheckout,
    subtotal: number,
    paymentMethod: PaymentMethod,
    now = Date.now()
): string | null {
    if (!coupon.ativo) return 'Este cupom está inativo.';
    if (coupon.data_validade) {
        const expiration = Date.parse(coupon.data_validade);
        if (!Number.isFinite(expiration)) return 'A validade deste cupom está configurada incorretamente.';
        if (expiration < now) return 'Este cupom está expirado.';
    }
    if (coupon.limite_uso !== null && coupon.limite_uso > 0 && coupon.usos_atuais >= coupon.limite_uso) {
        return 'Este cupom atingiu o limite de utilizações.';
    }
    if (
        coupon.metodo_pagamento_restrito &&
        coupon.metodo_pagamento_restrito !== paymentMethod
    ) {
        return coupon.metodo_pagamento_restrito === 'pix'
            ? 'Este cupom é válido apenas para PIX.'
            : 'Este cupom é válido apenas para Cartão de Crédito.';
    }
    if (coupon.valor_minimo !== null && subtotal < coupon.valor_minimo) {
        return `Valor mínimo para uso do cupom: R$ ${coupon.valor_minimo.toFixed(2).replace('.', ',')}`;
    }
    return null;
}

export function calculateCouponDiscount(
    coupon: CouponForCheckout,
    items: CheckoutItem[],
    products: PricedProduct[],
    paymentMethod: PaymentMethod
) {
    const productById = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;
    let eligibleSubtotal = 0;

    for (const item of items) {
        const product = productById.get(item.produto_id);
        if (!product) throw new Error('Um ou mais produtos não estão disponíveis.');
        const lineTotal = getUnitPrice(product, paymentMethod) * item.quantidade;
        subtotal += lineTotal;

        if (
            coupon.tipo_aplicacao !== 'produto' ||
            coupon.produtos_aplicaveis?.includes(item.produto_id)
        ) {
            eligibleSubtotal += lineTotal;
        }
    }

    if (!['geral', 'carrinho', 'produto'].includes(coupon.tipo_aplicacao)) {
        throw new Error('Regra de aplicação do cupom inválida.');
    }
    if (coupon.tipo_aplicacao === 'produto' && eligibleSubtotal <= 0) {
        throw new Error('O cupom não é aplicável aos produtos adicionados.');
    }

    const failure = getCouponFailure(coupon, subtotal, paymentMethod);
    if (failure) throw new Error(failure);

    const discountBase = coupon.tipo_aplicacao === 'produto' ? eligibleSubtotal : subtotal;
    const discountType = coupon.tipo_desconto || coupon.tipo;
    const discountValue = coupon.valor_desconto ?? coupon.valor ?? 0;

    let discount = 0;
    if (discountType === 'percentual' || discountType === 'porcentagem') {
        discount = discountBase * discountValue / 100;
    } else if (discountType === 'fixo' || discountType === 'valor_fixo') {
        discount = coupon.tipo_aplicacao === 'produto'
            ? items.filter((item) => coupon.produtos_aplicaveis?.includes(item.produto_id)).length * discountValue
            : discountValue;
    } else {
        throw new Error('Tipo de desconto do cupom inválido.');
    }

    if (!Number.isFinite(discount) || discount < 0) throw new Error('Valor de desconto inválido.');
    return { subtotal, discount: Math.min(discount, discountBase) };
}
