import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function maskName(value: string | null) {
    const parts = value?.trim().split(/\s+/).filter(Boolean) || [];
    if (parts.length === 0) return '';
    const firstName = parts[0];
    const lastInitial = parts.length > 1 && parts[parts.length - 1]?.[0] ? ` ${parts[parts.length - 1][0]}.` : '';
    return `${firstName}${lastInitial}`;
}

export async function GET() {
    try {
        const client = createSupabaseAdminClient();
        const { data: raffles, error: raffleError } = await client
            .from('rifas')
            .select('*')
            .eq('status', 'finalizada')
            .order('created_at', { ascending: false });
        if (raffleError) throw raffleError;

        const { data: prizes, error: prizesError } = await client
            .from('premios')
            .select('id, rifa_id, ordem, descricao, imagem_url, vencedor_numero, vencedor_nome')
            .not('vencedor_nome', 'is', null)
            .order('ordem', { ascending: true });
        if (prizesError) throw prizesError;

        return NextResponse.json({
            rifas: raffles || [],
            premios: (prizes || []).map((prize) => ({ ...prize, vencedor_nome: maskName(prize.vencedor_nome) }))
        });
    } catch (error) {
        console.error('Erro ao carregar histórico de rifas:', error);
        return NextResponse.json({ error: 'Não foi possível carregar o histórico.' }, { status: 500 });
    }
}
