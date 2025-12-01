'use server';

import { createClient } from '@supabase/supabase-js';

export async function getPaymentDetails(participanteId: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`🚀 [Pagamento] Iniciando busca para ID: ${participanteId}`);

    // --- DEBUG FORENSE DE CHAVE (SEM EXPOR O SEGREDO) ---
    if (!supabaseServiceKey) {
        console.error("⛔ CRÍTICO: SUPABASE_SERVICE_ROLE_KEY vazia/undefined.");
        return { success: false, error: 'ERRO: Chave Service Role não carregada.' };
    }

    try {
        // Decodifica o payload do JWT para confirmar a permissão real
        const [header, payloadBase64, signature] = supabaseServiceKey.split('.');
        if (payloadBase64) {
            const buffer = Buffer.from(payloadBase64, 'base64');
            const payload = JSON.parse(buffer.toString());
            console.log(`🔑 [DEBUG KEY] Role no Token: "${payload.role}" | Expira em: ${new Date(payload.exp * 1000).toISOString()}`);

            if (payload.role !== 'service_role') {
                console.error("⛔ PERIGO: A chave configurada NÃO é uma chave de serviço (service_role). É uma chave de nível: " + payload.role);
                return { success: false, error: `CONFIGURAÇÃO ERRADA: Você usou uma chave '${payload.role}' em vez da 'service_role'.` };
            }
        } else {
            console.error("⛔ A chave não parece ser um JWT válido.");
        }
    } catch (e) {
        console.error("⚠️ Falha ao inspecionar chave (pode estar mal formatada):", e);
    }
    // --- FIM DEBUG ---

    // Cria o cliente ADMIN
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        if (!participanteId || isNaN(participanteId)) {
            return { success: false, error: 'ID do participante inválido.' };
        }

        // 1. Busca Participante
        const { data: participante, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('*')
            .eq('id', participanteId)
            .single();

        if (partError) {
            console.error('❌ [Pagamento] Erro Supabase:', JSON.stringify(partError, null, 2));

            if (partError.code === 'PGRST116') {
                // Se chegamos aqui e a chave é service_role, o ID realmente não existe na tabela.
                return {
                    success: false,
                    error: `Reserva ${participanteId} não encontrada. (O banco retornou vazio).`
                };
            }
            if (partError.code === '42501') {
                return { success: false, error: 'Erro de Permissão (RLS). A chave usada não tem poder de Admin.' };
            }
            return { success: false, error: `Erro no banco: ${partError.message}` };
        }

        // 2. Busca Rifa Associada
        const { data: rifa, error: rifaError } = await supabaseAdmin
            .from('rifas')
            .select('*')
            .eq('id', participante.rifa_id)
            .single();

        if (rifaError) {
            return { success: false, error: 'Rifa associada não encontrada.' };
        }

        return { success: true, participante, rifa };

    } catch (error: any) {
        console.error('❌ [Pagamento] Erro inesperado:', error);
        return { success: false, error: error.message || 'Erro desconhecido no servidor.' };
    }
}