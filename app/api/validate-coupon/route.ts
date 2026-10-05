import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const normalizePaymentMethod = (value: unknown) => {
    if (typeof value !== 'string') return 'cartao_credito';
    const normalized = value.toLowerCase().trim();
    if (normalized === 'pix') return 'pix';
    if (normalized === 'cartao de crédito' || normalized === 'cartao_credito' || normalized === 'cartao') return 'cartao_credito';
    return 'cartao_credito';
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { codigo_cupom, itens_carrinho, metodo_pagamento } = body ?? {};
        const paymentMethod = normalizePaymentMethod(metodo_pagamento);

        if (
            typeof codigo_cupom !== 'string' ||
            !/^[\p{L}\p{N}_-]{1,64}$/u.test(codigo_cupom.trim()) ||
            !Array.isArray(itens_carrinho) ||
            itens_carrinho.length === 0 ||
            itens_carrinho.length > 50
        ) {
            return NextResponse.json({ valido: false, mensagem: 'Dados inválidos.' }, { status: 400 });
        }

        const quantitiesByProduct = new Map<number, number>();
        for (const item of itens_carrinho) {
            if (
                !item || !Number.isSafeInteger(item.produto_id) || item.produto_id <= 0 ||
                !Number.isSafeInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > 99
            ) {
                return NextResponse.json({ valido: false, mensagem: 'Itens do carrinho inválidos.' }, { status: 400 });
            }
            const quantity = (quantitiesByProduct.get(item.produto_id) || 0) + item.quantidade;
            if (quantity > 99) {
                return NextResponse.json({ valido: false, mensagem: 'A quantidade por produto não pode exceder 99 unidades.' }, { status: 400 });
            }
            quantitiesByProduct.set(item.produto_id, quantity);
        }
        const validItems = Array.from(quantitiesByProduct, ([produto_id, quantidade]) => ({ produto_id, quantidade }));

        const adminClient = createSupabaseAdminClient();
        const { data: cupom, error: cupomError } = await adminClient
            .from('cupons')
            .select('*')
            .ilike('codigo', codigo_cupom.trim())
            .single();

        if (cupomError || !cupom) {
            return NextResponse.json({ valido: false, mensagem: 'Cupom não encontrado.' });
        }

        if (!cupom.ativo) {
            return NextResponse.json({ valido: false, mensagem: 'Este cupom está inativo.' });
        }

        if (cupom.metodo_pagamento_restrito) {
            const requiredMethod = cupom.metodo_pagamento_restrito === 'pix' ? 'pix' : 'cartao_credito';
            if (paymentMethod !== requiredMethod) {
                const readable = requiredMethod === 'pix' ? 'PIX' : 'Cartão de Crédito';
                return NextResponse.json({ valido: false, mensagem: `Este cupom é válido apenas para ${readable}.` });
            }
        }

        const productIds = validItems.map((item) => item.produto_id);
        const { data: products, error: productsError } = await supabase
            .from('produtos')
            .select('id, preco, preco_promocional, preco_pix')
            .in('id', productIds);

        if (productsError) throw productsError;
        if (!products || products.length !== productIds.length) {
            return NextResponse.json({ valido: false, mensagem: 'Um ou mais produtos não estão disponíveis.' });
        }

        const calculateItemPrice = (product: (typeof products)[number]) => {
            if (paymentMethod === 'pix' && product.preco_pix && product.preco_pix > 0) {
                return product.preco_pix;
            }
            if (product.preco_promocional && product.preco_promocional < product.preco) {
                return product.preco_promocional;
            }
            return product.preco;
        };

        let subtotal = 0;
        let eligibleSubtotal = 0;

        validItems.forEach((item) => {
            const product = products.find((candidate) => candidate.id === item.produto_id);
            if (!product) return;

            const price = calculateItemPrice(product);
            subtotal += price * item.quantidade;

            if (cupom.tipo_aplicacao === 'produto' && Array.isArray(cupom.produtos_aplicaveis)) {
                if (cupom.produtos_aplicaveis.includes(item.produto_id)) {
                    eligibleSubtotal += price * item.quantidade;
                }
            } else {
                eligibleSubtotal += price * item.quantidade;
            }
        });

        if (cupom.tipo_aplicacao === 'produto' && (!cupom.produtos_aplicaveis || !cupom.produtos_aplicaveis.length || eligibleSubtotal <= 0)) {
            return NextResponse.json({ valido: false, mensagem: 'O cupom não é aplicável aos produtos adicionados.' });
        }

        if (cupom.valor_minimo && subtotal < cupom.valor_minimo) {
            return NextResponse.json({ valido: false, mensagem: `Valor mínimo para uso do cupom: R$ ${cupom.valor_minimo.toFixed(2).replace('.', ',')}` });
        }

        let discountValue = 0;
        const discountBase = cupom.tipo_aplicacao === 'produto' ? eligibleSubtotal : subtotal;

        if (cupom.tipo_desconto === 'percentual' || cupom.tipo === 'percentual' || cupom.tipo === 'porcentagem') {
            discountValue = (discountBase * (cupom.valor_desconto || cupom.valor)) / 100;
        } else if (cupom.tipo_desconto === 'fixo' || cupom.tipo === 'fixo' || cupom.tipo === 'valor_fixo') {
            discountValue = (cupom.valor_desconto || cupom.valor);
        }

        if (!Number.isFinite(discountValue) || discountValue < 0) discountValue = 0;
        if (discountValue > discountBase) discountValue = discountBase;

        return NextResponse.json({
            valido: true,
            mensagem: 'Cupom aplicado com sucesso!',
            cupom: {
                codigo: cupom.codigo,
                desconto: cupom.valor_desconto || cupom.valor,
                tipo: cupom.tipo_desconto || cupom.tipo,
                desconto_calculado: discountValue,
                metodo_pagamento_restrito: cupom.metodo_pagamento_restrito || null
            },
            total_recalculado: subtotal - discountValue
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        return NextResponse.json({ valido: false, mensagem: 'Erro interno no servidor.' }, { status: 500 });
    }
}
