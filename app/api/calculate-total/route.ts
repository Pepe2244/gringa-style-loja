import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const normalizePaymentMethod = (value: unknown) => {
    if (typeof value !== 'string') return 'cartao_credito';
    const normalized = value.toLowerCase().trim();
    if (normalized === 'pix') return 'pix';
    return 'cartao_credito';
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { itens, metodo_pagamento } = body ?? {};
        const paymentMethod = normalizePaymentMethod(metodo_pagamento);

        if (!Array.isArray(itens) || itens.length === 0 || itens.length > 50) {
            return NextResponse.json({ error: 'O carrinho deve conter entre 1 e 50 itens.' }, { status: 400 });
        }

        const quantitiesByProduct = new Map<number, number>();
        for (const item of itens) {
            if (
                !item || !Number.isSafeInteger(item.produto_id) || item.produto_id <= 0 ||
                !Number.isSafeInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > 99
            ) {
                return NextResponse.json({ error: 'Item ou quantidade inválida.' }, { status: 400 });
            }
            const quantity = (quantitiesByProduct.get(item.produto_id) || 0) + item.quantidade;
            if (quantity > 99) {
                return NextResponse.json({ error: 'A quantidade por produto não pode exceder 99 unidades.' }, { status: 400 });
            }
            quantitiesByProduct.set(item.produto_id, quantity);
        }
        const validItems = Array.from(quantitiesByProduct, ([produto_id, quantidade]) => ({ produto_id, quantidade }));

        const productIds = validItems.map((item) => item.produto_id);

        const { data: products, error } = await supabase
            .from('produtos')
            .select('id, preco, preco_promocional, preco_pix, em_estoque, "emEstoque"')
            .in('id', productIds);

        if (error) throw error;
        if (!products || products.length !== productIds.length) {
            return NextResponse.json({ error: 'Um ou mais produtos não estão disponíveis.' }, { status: 400 });
        }

        let total = 0;
        const validatedItems = [];

        for (const item of validItems) {
            const product = products.find((candidate) => candidate.id === item.produto_id);
            if (!product) {
                return NextResponse.json({ error: 'Um ou mais produtos não estão disponíveis.' }, { status: 400 });
            }

            if (product.em_estoque === false || !Number.isFinite(product.emEstoque) || item.quantidade > product.emEstoque) {
                return NextResponse.json({
                    error: `Estoque insuficiente para o produto. Disponível: ${product.emEstoque}, Solicitado: ${item.quantidade}`
                }, { status: 400 });
            }

            const price = paymentMethod === 'pix' && product.preco_pix && product.preco_pix > 0
                ? product.preco_pix
                : ((product.preco_promocional && product.preco_promocional < product.preco)
                    ? product.preco_promocional
                    : product.preco);

            if (!Number.isFinite(price) || price < 0) {
                return NextResponse.json({ error: 'Preço do produto inválido.' }, { status: 500 });
            }

            total += price * item.quantidade;

            validatedItems.push({
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: price,
                total_item: price * item.quantidade
            });
        }

        return NextResponse.json({
            total,
            itens: validatedItems
        });

    } catch (error) {
        console.error('Erro ao calcular total:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
