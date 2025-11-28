import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { codigo_cupom, itens_carrinho } = await request.json();

    if (!codigo_cupom) {
        return NextResponse.json({ valido: false, mensagem: 'Código inválido.' });
    }

    // Fetch coupon
    const { data: cupom, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', codigo_cupom)
        .single();

    if (error || !cupom) {
        return NextResponse.json({ valido: false, mensagem: 'Cupom inválido ou não encontrado.' });
    }

    // Check active status
    if (!cupom.ativo) {
        return NextResponse.json({ valido: false, mensagem: 'Este cupom está inativo.' });
    }

    // Check expiration
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
        return NextResponse.json({ valido: false, mensagem: 'Este cupom expirou.' });
    }

    // Check usage limit
    if (cupom.limite_uso !== null && cupom.usos_atuais >= cupom.limite_uso) {
        return NextResponse.json({ valido: false, mensagem: 'Este cupom atingiu o limite de uso.' });
    }

    // Calculate discount
    let descontoTotal = 0;
    let produtosAplicaveis = cupom.produtos_aplicaveis || [];

    if (cupom.tipo_aplicacao === 'geral') {
        // Apply to all items
        const subtotal = itens_carrinho.reduce((acc: number, item: any) => acc + (item.preco_unitario * item.quantidade), 0);
        if (cupom.tipo_desconto === 'percentual') {
            descontoTotal = (subtotal * cupom.valor_desconto) / 100;
        } else {
            descontoTotal = cupom.valor_desconto;
        }
    } else {
        // Apply to specific items
        itens_carrinho.forEach((item: any) => {
            if (produtosAplicaveis.includes(item.produto_id)) {
                const itemTotal = item.preco_unitario * item.quantidade;
                if (cupom.tipo_desconto === 'percentual') {
                    descontoTotal += (itemTotal * cupom.valor_desconto) / 100;
                } else {
                    // Fixed value per item? Or fixed value total distributed? 
                    // Usually fixed value is total, but for specific items it might be tricky.
                    // Let's assume fixed value is applied ONCE if any applicable item exists, or per item?
                    // Standard logic: Fixed amount off the eligible total.
                    // Let's calculate eligible total first.
                }
            }
        });

        // Recalculate for fixed on specific items to be safe
        if (cupom.tipo_desconto === 'fixo') {
            const eligibleTotal = itens_carrinho.reduce((acc: number, item: any) => {
                return produtosAplicaveis.includes(item.produto_id) ? acc + (item.preco_unitario * item.quantidade) : acc;
            }, 0);
            if (eligibleTotal > 0) {
                descontoTotal = cupom.valor_desconto; // Apply once
            }
        }
    }

    return NextResponse.json({
        valido: true,
        mensagem: 'Cupom aplicado com sucesso!',
        cupom: {
            codigo: cupom.codigo,
            desconto_calculado: descontoTotal,
            tipo_desconto: cupom.tipo_desconto,
            valor_desconto: cupom.valor_desconto
        }
    });
}
