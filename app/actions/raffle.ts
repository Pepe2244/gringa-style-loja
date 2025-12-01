'use server';

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function drawWinner(rifaId: number, prizeId: number, prizeDesc: string) {
    try {
        // 1. Fetch paid participants
        const { data: participants, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('nome, numeros_escolhidos')
            .eq('rifa_id', rifaId)
            .eq('status_pagamento', 'pago');

        if (partError) throw new Error('Erro ao buscar participantes: ' + partError.message);
        if (!participants || participants.length === 0) {
            return { success: false, message: 'Não há participantes pagos para sortear.' };
        }

        // 2. Get already drawn numbers
        const { data: drawnPrizes, error: drawnError } = await supabaseAdmin
            .from('premios')
            .select('vencedor_numero')
            .eq('rifa_id', rifaId)
            .not('vencedor_numero', 'is', null);

        if (drawnError) throw new Error('Erro ao buscar prêmios sorteados: ' + drawnError.message);

        const drawnNumbers = new Set(drawnPrizes?.map(p => p.vencedor_numero));

        // 3. Build pool of eligible numbers
        const pool: { number: number, name: string }[] = [];
        participants.forEach(p => {
            p.numeros_escolhidos.forEach((n: number) => {
                if (!drawnNumbers.has(n)) {
                    pool.push({ number: n, name: p.nome });
                }
            });
        });

        if (pool.length === 0) {
            return { success: false, message: 'Todos os números pagos já foram sorteados!' };
        }

        // 4. Secure Random Selection
        const randomIndex = crypto.randomInt(0, pool.length);
        const winner = pool[randomIndex];

        // 5. Save winner
        const { error: updateError } = await supabaseAdmin
            .from('premios')
            .update({
                vencedor_nome: winner.name,
                vencedor_numero: winner.number
            })
            .eq('id', prizeId);

        if (updateError) throw new Error('Erro ao salvar vencedor: ' + updateError.message);

        // 6. Notification
        await supabaseAdmin.from('notificacoes_push_queue').insert({
            titulo: '🎉 Temos um Vencedor!',
            mensagem: `Parabéns ${winner.name}! Você ganhou "${prizeDesc}" com o número ${winner.number}.`,
            link_url: `/acompanhar-rifa?id=${rifaId}`,
            status: 'rascunho'
        });

        return { success: true, winner };

    } catch (error: any) {
        console.error('Erro no sorteio:', error);
        return { success: false, message: error.message };
    }
}
