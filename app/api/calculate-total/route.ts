import { NextResponse } from 'next/server';
import {
    aggregateCartItems,
    calculateCouponDiscount,
    getUnitPrice,
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
            return NextResponse.json({ error: 'Dados do carrinho inválidos.' }, { status: 400 });
        }

        const input = body as { itens?: unknown; metodo_pagamento?: unknown; codigo_cupom?: unknown };
        const items = aggregateCartItems(input.itens);
        const paymentMethod = normalizePaymentMethod(input.metodo_pagamento);
        const normalizedCouponCode = typeof input.codigo_cupom === 'string' ? input.codigo_cupom.trim().toUpperCase() : null;

        if (input.codigo_cupom != null &&
            (normalizedCouponCode === null || !/^[\p{L}\p{N}_-]{1,64}$/u.test(normalizedCouponCode))) {
            return NextResponse.json({ error: 'Código de cupom inválido.' }, { status: 400 });
        }

        const productIds = Array.from(new Set(items.map((item) => item.produto_id)));
        const { data: products, error } = await supabase
            .from('produtos')
            .select('id, nome, preco, preco_promocional, preco_pix, em_estoque, variants')
            .in('id', productIds);

        if (error) throw error;
        if (!products || products.length !== productIds.length) {
            return NextResponse.json({ error: 'Um ou mais produtos não estão disponíveis.' }, { status: 400 });
        }

        const unavailableProduct = products.find((product) => product.em_estoque !== true);
        if (unavailableProduct) {
            return NextResponse.json({
                error: `O produto ${unavailableProduct.id} está fora de estoque.`,
            }, { status: 409 });
        }

        const pricedProducts = products as Array<PricedProduct & { nome: string; variants: unknown }>;
        const validatedItems = items.map((item) => {
            const product = pricedProducts.find((candidate) => candidate.id === item.produto_id);
            if (!product) throw new Error('Um ou mais produtos não estão disponíveis.');
            const rawVariants = product.variants;
            const variants = rawVariants && typeof rawVariants === 'object' && !Array.isArray(rawVariants)
                ? rawVariants as { tipo?: unknown; opcoes?: unknown }
                : null;
            const options = variants && Array.isArray(variants.opcoes) ? variants.opcoes : [];
            if (options.length > 0) {
                if (
                    !item.variante ||
                    item.variante.tipo !== variants?.tipo ||
                    !options.includes(item.variante.opcao)
                ) {
                    throw new Error(`Selecione uma opção válida para o produto ${product.nome}.`);
                }
            } else if (item.variante) {
                throw new Error(`O produto ${product.nome} não possui opções selecionáveis.`);
            }
            const unitPrice = getUnitPrice(product, paymentMethod);
            return {
                ...item,
                nome: product.nome,
                preco_unitario: unitPrice,
                total_item: unitPrice * item.quantidade,
            };
        });
        const subtotal = validatedItems.reduce((total, item) => total + item.total_item, 0);

        let discount = 0;
        let couponCode: string | null = null;
        if (normalizedCouponCode !== null) {
            const client = createSupabaseAdminClient();
            const { data: coupon, error: couponError } = await client
                .from('cupons')
                .select('*')
                .eq('codigo', normalizedCouponCode)
                .maybeSingle();
            if (couponError) throw couponError;
            if (!coupon) return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 400 });

            const calculation = calculateCouponDiscount(
                coupon as CouponForCheckout,
                items,
                pricedProducts,
                paymentMethod,
            );
            discount = calculation.discount;
            couponCode = coupon.codigo;
        }

        return NextResponse.json({
            subtotal,
            desconto: discount,
            total: Math.max(0, subtotal - discount),
            itens: validatedItems,
            cupom: couponCode,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
        const status = /carrinho|item|quantidade|cupom|desconto|mínimo|expirado|utilizações|apenas para|aplicável|validade|método|opção|produto/i.test(message)
            ? 400
            : 500;
        console.error('Erro ao calcular total:', error);
        return NextResponse.json({ error: status === 500 ? 'Erro interno do servidor.' : message }, { status });
    }
}
