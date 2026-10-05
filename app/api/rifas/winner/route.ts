import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function maskName(value: string | null) {
    const firstName = value?.trim().split(/\s+/)[0];
    return firstName ? `${firstName} ********` : '';
}

function maskPhone(value: string | null) {
    const digits = value?.replace(/\D/g, '') ?? '';
    if (digits.length < 10) return '';
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-****`;
}

export async function GET(request: NextRequest) {
    const rawId = request.nextUrl.searchParams.get('id');
    if (!rawId || !/^\d{1,12}$/.test(rawId)) {
        return NextResponse.json({ error: 'ID da rifa inválido.' }, { status: 400 });
    }

    try {
        const client = createSupabaseAdminClient();
        const { data, error } = await client
            .from('premios')
            .select('vencedor_numero, vencedor_nome, vencedor_telefone')
            .eq('rifa_id', Number(rawId))
            .not('vencedor_numero', 'is', null);
        if (error) throw error;
        return NextResponse.json({
            winners: (data || []).map((prize) => ({
                vencedor_numero: prize.vencedor_numero,
                vencedor_nome: maskName(prize.vencedor_nome),
                vencedor_telefone: maskPhone(prize.vencedor_telefone)
            }))
        });
    } catch (error) {
        console.error('Erro ao carregar resultado da rifa:', error);
        return NextResponse.json({ error: 'Não foi possível carregar o resultado.' }, { status: 500 });
    }
}
