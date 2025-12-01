import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Note: In API routes, we should ideally use a service client if we need to bypass RLS, but for reading products, public access is fine.
// However, to validate coupons securely, we should fetch product prices from DB, not trust the client.

export async function POST(request: Request) {
    try {
        const { codigo_cupom, itens_carrinho } = await request.json();

        if (!codigo_cupom || !itens_carrinho || !Array.isArray(itens_carrinho)) {
            return NextResponse.json({ valido: false, mensagem: 'Dados inválidos.' }, { status: 400 });
        }

        // 1. Fetch Coupon
        const { data: cupom, error: cupomError } = await supabase
            .from('cupons') // Assuming table name 'cupons'
            .select('*')
            .ilike('codigo', codigo_cupom) // Case insensitive check
            .single();

        if (cupomError || !cupom) {
            return NextResponse.json({ valido: false, mensagem: 'Cupom não encontrado.' });
        }

        if (!cupom.ativo) {
            return NextResponse.json({ valido: false, mensagem: 'Este cupom está inativo.' });
        }

        // Check expiration if applicable (assuming 'validade' column exists or similar)
        // if (cupom.validade && new Date(cupom.validade) < new Date()) ...

        // 2. Calculate Total based on DB prices
        const productIds = itens_carrinho.map((item: any) => item.produto_id);
        const { data: products } = await supabase
            .from('produtos')
            .select('id, preco, preco_promocional')
            .in('id', productIds);

        if (!products) {
            return NextResponse.json({ valido: false, mensagem: 'Erro ao validar produtos.' });
        }

        let subtotal = 0;
        itens_carrinho.forEach((item: any) => {
            const product = products.find(p => p.id === item.produto_id);
            if (product) {
                const price = (product.preco_promocional && product.preco_promocional < product.preco)
                    ? product.preco_promocional
                    : product.preco;
                subtotal += price * (item.quantidade || 1);
            }
        });

        // 3. Calculate Discount
        let discountValue = 0;
        if (cupom.tipo_desconto === 'percentual' || cupom.tipo === 'percentual' || cupom.tipo === 'porcentagem') {
            discountValue = (subtotal * (cupom.valor_desconto || cupom.valor)) / 100;
        } else if (cupom.tipo_desconto === 'fixo' || cupom.tipo === 'fixo') {
            discountValue = (cupom.valor_desconto || cupom.valor);
        }

        // Ensure discount doesn't exceed subtotal
        if (discountValue > subtotal) discountValue = subtotal;

        return NextResponse.json({
            valido: true,
            mensagem: 'Cupom aplicado com sucesso!',
            cupom: {
                codigo: cupom.codigo,
                desconto: cupom.valor_desconto || cupom.valor,
                tipo: cupom.tipo_desconto || cupom.tipo,
                desconto_calculado: discountValue
            },
            total_recalculado: subtotal - discountValue
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        return NextResponse.json({ valido: false, mensagem: 'Erro interno no servidor.' }, { status: 500 });
    }
}
