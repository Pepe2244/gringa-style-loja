import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { itens } = await request.json();

        if (!itens || !Array.isArray(itens)) {
            return NextResponse.json({ error: 'Itens inválidos' }, { status: 400 });
        }

        const productIds = itens.map((item: any) => item.produto_id);

        const { data: products, error } = await supabase
            .from('produtos')
            .select('id, preco, preco_promocional, "emEstoque"')
            .in('id', productIds);

        if (error) throw error;

        let total = 0;
        const validatedItems = [];

        for (const item of itens) {
            const product = products.find(p => p.id === item.produto_id);

            if (!product) continue;

            if (item.quantidade > product.emEstoque) {
                return NextResponse.json({
                    error: `Estoque insuficiente para o produto. Disponível: ${product.emEstoque}, Solicitado: ${item.quantidade}`
                }, { status: 400 });
            }

            const price = (product.preco_promocional && product.preco_promocional < product.preco)
                ? product.preco_promocional
                : product.preco;

            total += price * item.quantidade;

            validatedItems.push({
                ...item,
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

