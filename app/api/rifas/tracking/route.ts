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
    if (rawId && !/^\d{1,12}$/.test(rawId)) {
        return NextResponse.json({ error: 'ID da rifa inválido.' }, { status: 400 });
    }

    try {
        const client = createSupabaseAdminClient();
        let raffleQuery = client.from('rifas').select('*');
        raffleQuery = rawId
            ? raffleQuery.eq('id', Number(rawId))
            : raffleQuery.eq('status', 'ativa').limit(1);

        const { data: raffle, error: raffleError } = rawId
            ? await raffleQuery.single()
            : await raffleQuery.maybeSingle();
        if (raffleError && raffleError.code !== 'PGRST116') throw raffleError;
        if (!raffle) return NextResponse.json({ rifa: null, participantes: [], premios: [] });

        const { data: participants, error: participantsError } = await client
            .from('participantes_rifa')
            .select('nome, numeros_escolhidos, status_pagamento')
            .eq('rifa_id', raffle.id);
        if (participantsError) throw participantsError;

        let prizes: { vencedor_numero: number | null; vencedor_nome: string | null; vencedor_telefone: string | null }[] = [];
        if (raffle.status === 'finalizada') {
            const { data, error } = await client
                .from('premios')
                .select('vencedor_numero, vencedor_nome, vencedor_telefone')
                .eq('rifa_id', raffle.id);
            if (error) throw error;
            prizes = (data || []).map((prize) => ({
                vencedor_numero: prize.vencedor_numero,
                vencedor_nome: maskName(prize.vencedor_nome),
                vencedor_telefone: maskPhone(prize.vencedor_telefone)
            }));
        }

        return NextResponse.json({
            rifa: raffle,
            participantes: (participants || []).map((participant) => ({
                nome: maskName(participant.nome),
                numeros_escolhidos: participant.numeros_escolhidos,
                status_pagamento: participant.status_pagamento
            })),
            premios: prizes
        });
    } catch (error) {
        console.error('Erro ao carregar acompanhamento de rifa:', error);
        return NextResponse.json({ error: 'Não foi possível carregar o acompanhamento.' }, { status: 500 });
    }
}
