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

    // Validations
    if (!cupom.ativo) return NextResponse.json({ valido: false, mensagem: 'Este cupom está inativo.' });
    if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) return NextResponse.json({ valido: false, mensagem: 'Este cupom expirou.' });
    if (cupom.limite_uso !== null && cupom.usos_atuais >= cupom.limite_uso) return NextResponse.json({ valido: false, mensagem: 'Este cupom atingiu o limite de uso.' });

    // Calculate Eligible Total
    const produtosAplicaveis = cupom.produtos_aplicaveis || [];
    const isGeral = cupom.tipo_aplicacao === 'geral';

    const eligibleTotal = itens_carrinho.reduce((acc: number, item: any) => {
        if (isGeral || produtosAplicaveis.includes(item.produto_id)) {
            return acc + (item.preco_unitario * item.quantidade);
        }
        return acc;
    }, 0);

    if (eligibleTotal === 0) {
        return NextResponse.json({ valido: false, mensagem: 'Este cupom não se aplica aos itens do seu carrinho.' });
    }

    // Calculate Discount
    let descontoTotal = 0;
    if (cupom.tipo_desconto === 'percentual') {
        descontoTotal = (eligibleTotal * cupom.valor_desconto) / 100;
    } else {
        descontoTotal = cupom.valor_desconto;
    }

    // Ensure discount doesn't exceed total
    descontoTotal = Math.min(descontoTotal, eligibleTotal);

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
