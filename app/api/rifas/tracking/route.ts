import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function maskName(value: string | null) {
    const parts = value?.trim().split(/\s+/).filter(Boolean) || [];
    if (parts.length === 0) return '';
    const firstName = parts[0];
    const lastInitial = parts.length > 1 && parts[parts.length - 1]?.[0] ? ` ${parts[parts.length - 1][0]}.` : '';
    return `${firstName}${lastInitial}`;
}

function maskPhone(value: string | null) {
    const digits = value?.replace(/\D/g, '') ?? '';
    if (digits.length < 10) return '';
    return `(${digits.slice(0, 2)}) *****-**${digits.slice(-2)}`;
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
            : raffleQuery.eq('status', 'ativa').order('created_at', { ascending: false }).limit(1);

        const { data: raffle, error: raffleError } = rawId
            ? await raffleQuery.single()
            : await raffleQuery.maybeSingle();
        if (raffleError && raffleError.code !== 'PGRST116') throw raffleError;
        if (!raffle) return NextResponse.json({ rifa: null, participantes: [], premios: [] });

        const PAGE_SIZE = 1000;
        const MAX_PAGES = 20;
        const participants: Array<{ nome: string | null; numeros_escolhidos: number[] | null; status_pagamento: string | null }> = [];
        for (let page = 0; page < MAX_PAGES; page++) {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data: batch, error: participantsError } = await client
                .from('participantes_rifa')
                .select('nome, numeros_escolhidos, status_pagamento')
                .eq('rifa_id', raffle.id)
                .order('id', { ascending: true })
                .range(from, to);
            if (participantsError) throw participantsError;
            if (!batch || batch.length === 0) break;
            participants.push(...batch);
            if (batch.length < PAGE_SIZE) break;
        }

        let prizes: { id: number; ordem: number | null; descricao: string | null; vencedor_numero: number | null; vencedor_nome: string | null; vencedor_telefone: string | null }[] = [];
        if (raffle.status === 'finalizada') {
            const { data, error } = await client
                .from('premios')
                .select('id, ordem, descricao, vencedor_numero, vencedor_nome, vencedor_telefone')
                .eq('rifa_id', raffle.id)
                .order('ordem', { ascending: true });
            if (error) throw error;
            prizes = (data || []).map((prize) => ({
                id: prize.id,
                ordem: prize.ordem,
                descricao: prize.descricao,
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
