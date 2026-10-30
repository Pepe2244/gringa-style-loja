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
    data_validade?: string | null;
    limite_uso?: number | null;
    limite_usos?: number | null;
    usos_atuais?: number;
    quantidade_usos?: number;
    metodo_pagamento_restrito?: string | null;
    valor_minimo?: number | null;
    valor_minimo_pedido?: number | null;
    tipo_aplicacao?: string;
    produtos_aplicaveis?: number[] | null;
    tipo_desconto?: string | null;
    valor_desconto?: number | null;
    tipo?: string | null;
    valor?: number | null;
}

export type PaymentMethod = 'pix' | 'cartao_credito';

const normalizePaymentMethodValue = (value: unknown): string => {
    if (value == null) return '';
    return String(value)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
};

export function normalizePaymentMethod(value: unknown): PaymentMethod {
    if (value == null || value === '') return 'cartao_credito';
    if (typeof value !== 'string') throw new Error('Método de pagamento inválido.');
    const normalized = normalizePaymentMethodValue(value);
    if (normalized === 'pix') return 'pix';
    if (['cartao_credito', 'cartao_de_credito', 'credit_card', 'credito'].includes(normalized)) {
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

    const promotionalPrice = product.preco_promocional;
    const baseEffectivePrice =
        promotionalPrice !== null && promotionalPrice > 0 && promotionalPrice < product.preco
            ? promotionalPrice
            : product.preco;

    const pixPrice = product.preco_pix;
    if (paymentMethod === 'pix' && pixPrice !== null && pixPrice > 0 && pixPrice < product.preco) {
        return Math.min(pixPrice, baseEffectivePrice);
    }

    return baseEffectivePrice;
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

    const usageLimit = coupon.limite_uso ?? coupon.limite_usos ?? null;
    const currentUses = coupon.usos_atuais ?? coupon.quantidade_usos ?? 0;
    if (usageLimit !== null && usageLimit > 0 && currentUses >= usageLimit) {
        return 'Este cupom atingiu o limite de utilizações.';
    }

    const rawRestricted = normalizePaymentMethodValue(coupon.metodo_pagamento_restrito);
    const restrictedMethod: PaymentMethod | null = !rawRestricted
        ? null
        : rawRestricted === 'pix'
            ? 'pix'
            : ['cartao_credito', 'cartao_de_credito', 'credit_card', 'credito'].includes(rawRestricted)
                ? 'cartao_credito'
                : null;
    if (restrictedMethod && restrictedMethod !== paymentMethod) {
        return restrictedMethod === 'pix'
            ? 'Este cupom é válido apenas para PIX.'
            : 'Este cupom é válido apenas para Cartão de Crédito.';
    }

    const minPurchase = coupon.valor_minimo ?? coupon.valor_minimo_pedido ?? null;
    if (minPurchase !== null && minPurchase > 0 && subtotal < minPurchase) {
        return `Valor mínimo para uso do cupom: R$ ${minPurchase.toFixed(2).replace('.', ',')}`;
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
    const eligibleProducts = new Set<number>();
    const appType = coupon.tipo_aplicacao || 'geral';

    for (const item of items) {
        const product = productById.get(item.produto_id);
        if (!product) throw new Error('Um ou mais produtos não estão disponíveis.');
        const lineTotal = getUnitPrice(product, paymentMethod) * item.quantidade;
        subtotal += lineTotal;

        if (appType === 'produto' && coupon.produtos_aplicaveis?.includes(item.produto_id)) {
            eligibleProducts.add(item.produto_id);
        }

        if (
            appType !== 'produto' ||
            coupon.produtos_aplicaveis?.includes(item.produto_id)
        ) {
            eligibleSubtotal += lineTotal;
        }
    }

    if (!['geral', 'carrinho', 'produto'].includes(appType)) {
        throw new Error('Regra de aplicação do cupom inválida.');
    }
    if (appType === 'produto' && eligibleSubtotal <= 0) {
        throw new Error('O cupom não é aplicável aos produtos adicionados.');
    }

    const failure = getCouponFailure(coupon, subtotal, paymentMethod);
    if (failure) throw new Error(failure);

    const discountBase = appType === 'produto' ? eligibleSubtotal : subtotal;
    const rawDiscountType = coupon.tipo_desconto || coupon.tipo || 'percentual';
    const discountType = rawDiscountType.toLowerCase();
    const discountValue = coupon.valor_desconto ?? coupon.valor ?? 0;

    let discount = 0;
    if (discountType === 'percentual' || discountType === 'porcentagem') {
        discount = discountBase * discountValue / 100;
    } else if (discountType === 'fixo' || discountType === 'valor_fixo') {
        if (appType === 'produto') {
            discount = 0;
            for (const productId of eligibleProducts) {
                const product = productById.get(productId);
                if (product) {
                    const totalQty = items
                        .filter((i) => i.produto_id === productId)
                        .reduce((acc, i) => acc + i.quantidade, 0);
                    const productLineTotal = getUnitPrice(product, paymentMethod) * totalQty;
                    discount += Math.min(productLineTotal, discountValue);
                }
            }
        } else {
            discount = discountValue;
        }
    } else {
        throw new Error('Tipo de desconto do cupom inválido.');
    }

    if (!Number.isFinite(discount) || discount < 0) throw new Error('Valor de desconto inválido.');
    return { subtotal, discount: Math.min(discount, discountBase) };
}
