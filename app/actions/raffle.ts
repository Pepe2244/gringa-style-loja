'use server';

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function drawWinner(rifaId: number, prizeId: number, prizeDesc: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`🎲 [Sorteio] Iniciando... Rifa: ${rifaId}, Prêmio: ${prizeId}`);

    // --- 1. CHECK DE SEGURANÇA E CREDENCIAIS ---
    if (!supabaseServiceKey) {
        console.error("⛔ CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não definida.");
        return { success: false, message: 'Erro interno: Chave de segurança ausente.' };
    }

    // Cria o cliente ADMIN
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 2. Buscar participantes com status 'pago'
        console.log("🔍 Buscando participantes pagos...");
        const { data: participants, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('nome, numeros_escolhidos')
            .eq('rifa_id', rifaId)
            .eq('status_pagamento', 'pago');

        if (partError) {
            console.error('❌ Erro DB (Participantes):', partError);
            return { success: false, message: 'Erro ao buscar participantes.' };
        }

        if (!participants || participants.length === 0) {
            console.warn('⚠️ Nenhum participante pago encontrado.');
            return { success: false, message: 'Sem participantes pagos para sortear.' };
        }

        console.log(`✅ Encontrados ${participants.length} participantes pagos.`);

        // 3. Buscar números já sorteados para excluí-los
        const { data: drawnPrizes, error: drawnError } = await supabaseAdmin
            .from('premios')
            .select('vencedor_numero')
            .eq('rifa_id', rifaId)
            .not('vencedor_numero', 'is', null);

        if (drawnError) {
            console.error('❌ Erro DB (Prêmios):', drawnError);
            return { success: false, message: 'Erro ao verificar sorteios anteriores.' };
        }

        const drawnNumbers = new Set(drawnPrizes?.map(p => p.vencedor_numero));

        // 4. Construir pool de sorteio
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

        console.log(`📊 Pool de sorteio: ${pool.length} números disponíveis.`);

        if (pool.length === 0) {
            return { success: false, message: 'Todos os números vendidos já foram premiados!' };
        }

        // 5. Sorteio Seguro
        const randomIndex = crypto.randomInt(0, pool.length);
        const winner = pool[randomIndex];

        console.log(`🏆 VENCEDOR: ${winner.name} (Nº ${winner.number})`);

        // 6. Persistir Vencedor
        // CORREÇÃO: Removido .select() para evitar erro 400 Bad Request se o retorno falhar
        const { error: updateError } = await supabaseAdmin
            .from('premios')
            .update({
                vencedor_nome: winner.name,
                vencedor_numero: winner.number
            })
            .eq('id', prizeId);

        if (updateError) {
            console.error('❌ Erro ao salvar vencedor:', updateError);
            return { success: false, message: 'Erro ao salvar o ganhador: ' + updateError.message };
        }

        // 7. Notificação (Opcional)
        // Usando try-catch separado para não falhar o sorteio se a notificação falhar
        try {
            await supabaseAdmin.from('notificacoes_push_queue').insert({
                titulo: '🏆 Temos um Vencedor!',
                mensagem: `O prêmio "${prizeDesc}" saiu para ${winner.name} (Nº ${winner.number})!`,
                link_url: `/acompanhar-rifa?id=${rifaId}`,
                status: 'rascunho'
            });
        } catch (notifyError) {
            console.error('⚠️ Falha ao criar notificação (não crítico):', notifyError);
        }

        return { success: true, winner };

    } catch (error: any) {
        console.error('❌ Erro fatal:', error);
        return { success: false, message: error.message || 'Erro desconhecido.' };
    }
}