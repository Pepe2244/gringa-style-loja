'use server';

import { supabase } from '@/lib/supabase';

export async function drawWinner(rifaId: number, prizeId: number, prizeDesc: string) {
    try {
        // 1. Busca todos os participantes pagos desta rifa
        const { data: tickets, error: ticketError } = await supabase
            .from('participantes_rifa')
            .select('id, nome, numeros_escolhidos, telefone')
            .eq('rifa_id', rifaId)
            .eq('status_pagamento', 'pago');

        if (ticketError) throw ticketError;

        if (!tickets || tickets.length === 0) {
            return { success: false, message: 'Nenhum número pago encontrado para esta rifa. Aprove pagamentos antes de sortear.' };
        }

        // 2. Extrai cada número comprado para um array de "bilhetes da urna"
        let pool: { number: number, participantId: number, name: string, phone: string }[] = [];

        tickets.forEach(t => {
            if (t.numeros_escolhidos && Array.isArray(t.numeros_escolhidos)) {
                t.numeros_escolhidos.forEach((n: number) => {
                    pool.push({ number: n, participantId: t.id, name: t.nome, phone: t.telefone });
                });
            }
        });

        if (pool.length === 0) {
            return { success: false, message: 'Os participantes não têm números válidos.' };
        }

        // 3. O SORTEIO MATEMÁTICO
        const randomIndex = Math.floor(Math.random() * pool.length);
        const winner = pool[randomIndex];

        // 4. Salva o vencedor na tabela de prêmios
        const { error: premioError } = await supabase.from('premios').update({
            vencedor_nome: winner.name,
            vencedor_numero: winner.number,
            vencedor_telefone: winner.phone
        }).eq('id', prizeId);

        if (premioError) throw premioError;

        // 5. A CORREÇÃO DE OURO: FECHAR A RIFA AQUI, NO SERVIDOR!
        const { error: rifaError } = await supabase.from('rifas').update({
            status: 'finalizada',
            numero_vencedor: winner.number
        }).eq('id', rifaId);

        if (rifaError) throw rifaError;

        // Sucesso absoluto. Devolve o vencedor para a tela.
        return { success: true, winner };

    } catch (error: any) {
        console.error("Erro CRÍTICO no Sorteio Server Action:", error);
        return { success: false, message: error.message || 'Erro interno no sorteio.' };
    }
}

