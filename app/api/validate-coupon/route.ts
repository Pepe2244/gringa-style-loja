import { NextResponse } from 'next/server';
import {
    aggregateCartItems,
    calculateCouponDiscount,
    normalizePaymentMethod,
    type CouponForCheckout,
    type PricedProduct,
} from '@/lib/checkout-pricing';
import { supabase } from '@/lib/supabase';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const body: unknown = await request.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ valido: false, mensagem: 'Dados inválidos.' }, { status: 400 });
        }
        const input = body as {
            codigo_cupom?: unknown;
            itens_carrinho?: unknown;
            metodo_pagamento?: unknown;
        };
        if (
            typeof input.codigo_cupom !== 'string' ||
            !/^[\p{L}\p{N}_-]{1,64}$/u.test(input.codigo_cupom.trim())
        ) {
            return NextResponse.json({ valido: false, mensagem: 'Código de cupom inválido.' }, { status: 400 });
        }

        const items = aggregateCartItems(input.itens_carrinho);
        const paymentMethod = normalizePaymentMethod(input.metodo_pagamento);
        const adminClient = createSupabaseAdminClient();
        const { data: coupon, error: couponError } = await adminClient
            .from('cupons')
            .select('*')
            .eq('codigo', input.codigo_cupom.trim().toUpperCase())
            .maybeSingle();

        if (couponError) throw couponError;
        if (!coupon) return NextResponse.json({ valido: false, mensagem: 'Cupom não encontrado.' });

        const productIds = Array.from(new Set(items.map((item) => item.produto_id)));
        const { data: products, error: productsError } = await supabase
            .from('produtos')
            .select('id, nome, preco, preco_promocional, preco_pix, em_estoque')
            .in('id', productIds);
        if (productsError) throw productsError;
        if (!products || products.length !== productIds.length) {
            return NextResponse.json({ valido: false, mensagem: 'Um ou mais produtos não estão disponíveis.' });
        }
        if (products.some((product) => product.em_estoque !== true)) {
            return NextResponse.json({ valido: false, mensagem: 'Um ou mais produtos estão fora de estoque.' });
        }

        const calculation = calculateCouponDiscount(
            coupon as CouponForCheckout,
            items,
            products as PricedProduct[],
            paymentMethod,
        );

        return NextResponse.json({
            valido: true,
            mensagem: 'Cupom aplicado com sucesso!',
            cupom: {
                codigo: coupon.codigo,
                desconto: coupon.valor_desconto ?? coupon.valor,
                tipo: coupon.tipo_desconto || coupon.tipo,
                desconto_calculado: calculation.discount,
                metodo_pagamento_restrito: coupon.metodo_pagamento_restrito || null,
            },
            total_recalculado: calculation.subtotal - calculation.discount,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno no servidor.';
        const clientError = /carrinho|item|quantidade|cupom|desconto|mínimo|expirado|utilizações|apenas para|aplicável|validade/i.test(message);
        console.error('Erro ao validar cupom:', error);
        return NextResponse.json(
            { valido: false, mensagem: clientError ? message : 'Erro interno no servidor.' },
            { status: clientError ? 400 : 500 },
        );
    }
}
