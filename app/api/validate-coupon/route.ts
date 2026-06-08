import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const normalizePaymentMethod = (value: unknown) => {
    if (typeof value !== 'string') return 'cartao_credito';
    const normalized = value.toLowerCase().trim();
    if (normalized === 'pix') return 'pix';
    if (normalized === 'cartao de crédito' || normalized === 'cartao_credito' || normalized === 'cartao') return 'cartao_credito';
    return 'cartao_credito';
};

export async function POST(request: Request) {
    try {
        const { codigo_cupom, itens_carrinho, metodo_pagamento } = await request.json();
        const paymentMethod = normalizePaymentMethod(metodo_pagamento);

        if (!codigo_cupom || !itens_carrinho || !Array.isArray(itens_carrinho)) {
            return NextResponse.json({ valido: false, mensagem: 'Dados inválidos.' }, { status: 400 });
        }

        const { data: cupom, error: cupomError } = await supabase
            .from('cupons')
            .select('*')
            .ilike('codigo', codigo_cupom)
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

        const productIds = itens_carrinho.map((item: any) => item.produto_id);
        const { data: products } = await supabase
            .from('produtos')
            .select('id, preco, preco_promocional, preco_pix')
            .in('id', productIds);

        if (!products) {
            return NextResponse.json({ valido: false, mensagem: 'Erro ao validar produtos.' });
        }

        const calculateItemPrice = (product: any) => {
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

        itens_carrinho.forEach((item: any) => {
            const product = products.find((p: any) => p.id === item.produto_id);
            if (!product) return;

            const price = calculateItemPrice(product);
            subtotal += price * (item.quantidade || 1);

            if (cupom.tipo_aplicacao === 'produto' && Array.isArray(cupom.produtos_aplicaveis)) {
                if (cupom.produtos_aplicaveis.includes(item.produto_id)) {
                    eligibleSubtotal += price * (item.quantidade || 1);
                }
            } else {
                eligibleSubtotal += price * (item.quantidade || 1);
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
