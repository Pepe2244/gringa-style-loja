'use server';

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function drawWinner(rifaId: number, prizeId: number, prizeDesc: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log(`🎲 [Sorteio] Iniciando sorteio para Rifa ID: ${rifaId}, Prêmio ID: ${prizeId}`);

    // --- CHECK DE SEGURANÇA (Igual ao pagamento) ---
    if (!supabaseServiceKey) {
        console.error("⛔ CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não encontrada.");
        return { success: false, message: 'Erro interno: Chave de segurança não configurada.' };
    }

    if (supabaseServiceKey === supabaseAnonKey) {
        console.error("⛔ PERIGO: A chave SERVICE_ROLE é igual à chave ANON.");
        return { success: false, message: 'ERRO DE CONFIG: Chave de Admin inválida (está igual à pública).' };
    }

    // Cria o cliente ADMIN com a chave de serviço para ignorar regras RLS e poder ler participantes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Buscar participantes PAGOS
        const { data: participants, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('nome, numeros_escolhidos')
            .eq('rifa_id', rifaId)
            .eq('status_pagamento', 'pago');

        if (partError) {
            console.error('❌ Erro ao buscar participantes:', partError);
            return { success: false, message: 'Erro ao buscar participantes no banco.' };
        }

        if (!participants || participants.length === 0) {
            console.warn('⚠️ Nenhum participante pago encontrado para esta rifa.');
            return { success: false, message: 'Não há participantes com pagamento confirmado para sortear.' };
        }

        // 2. Buscar números já sorteados (para não repetir ganhador no mesmo número)
        const { data: drawnPrizes, error: drawnError } = await supabaseAdmin
            .from('premios')
            .select('vencedor_numero')
            .eq('rifa_id', rifaId)
            .not('vencedor_numero', 'is', null);

        if (drawnError) {
            console.error('❌ Erro ao buscar prêmios já sorteados:', drawnError);
            throw new Error('Erro ao verificar prêmios anteriores.');
        }

        const drawnNumbers = new Set(drawnPrizes?.map(p => p.vencedor_numero));

        // 3. Construir pool de números elegíveis (apenas números comprados e não sorteados ainda)
        const pool: { number: number, name: string }[] = [];
        participants.forEach(p => {
            if (p.numeros_escolhidos && Array.isArray(p.numeros_escolhidos)) {
                p.numeros_escolhidos.forEach((n: number) => {
                    if (!drawnNumbers.has(n)) {
                        pool.push({ number: n, name: p.nome });
                    }
                });
            }
        });

        console.log(`📊 Total de números elegíveis para sorteio: ${pool.length}`);

        if (pool.length === 0) {
            return { success: false, message: 'Todos os números pagos já foram sorteados!' };
        }

        // 4. Seleção Aleatória Segura (Crypto)
        const randomIndex = crypto.randomInt(0, pool.length);
        const winner = pool[randomIndex];

        console.log(`🎉 Vencedor Sorteado: ${winner.name} (Nº ${winner.number})`);

        // 5. Salvar vencedor no banco
        const { error: updateError } = await supabaseAdmin
            .from('premios')
            .update({
                vencedor_nome: winner.name,
                vencedor_numero: winner.number
            })
            .eq('id', prizeId);

        if (updateError) {
            console.error('❌ Erro ao salvar vencedor:', updateError);
            throw new Error('Erro ao salvar o vencedor no banco de dados.');
        }

        // 6. Criar Notificação (Não bloqueante)
        try {
            await supabaseAdmin.from('notificacoes_push_queue').insert({
                titulo: '🏆 Temos um Vencedor!',
                mensagem: `O prêmio "${prizeDesc}" saiu para ${winner.name} (Nº ${winner.number})!`,
                link_url: `/acompanhar-rifa?id=${rifaId}`,
                status: 'rascunho'
            });
        } catch (notifyError) {
            console.warn('⚠️ Falha ao criar notificação (não crítico):', notifyError);
        }

        return { success: true, winner };

    } catch (error: any) {
        console.error('❌ Erro fatal no sorteio:', error);
        return { success: false, message: error.message || 'Erro desconhecido ao sortear.' };
    }
}