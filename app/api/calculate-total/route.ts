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
            .select('id, preco, preco_promocional')
            .in('id', productIds);

        if (error) throw error;

        let total = 0;
        const validatedItems = itens.map((item: any) => {
            const product = products.find(p => p.id === item.produto_id);
            if (!product) return null;

            const price = (product.preco_promocional && product.preco_promocional < product.preco)
                ? product.preco_promocional
                : product.preco;

            total += price * item.quantidade;

            return {
                ...item,
                preco_unitario: price,
                total_item: price * item.quantidade
            };
        }).filter(Boolean);

        return NextResponse.json({
            total,
            itens: validatedItems
        });

    } catch (error) {
        console.error('Erro ao calcular total:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
