'use server';

import { createClient } from '@supabase/supabase-js';

export async function getPaymentDetails(participanteId: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // DIAGNÓSTICO DE CHAVES (Executado no Servidor)
    if (!supabaseServiceKey) {
        console.error("⛔ CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente.");
        return { success: false, error: 'Erro interno: Chave de segurança não configurada.' };
    }

    if (supabaseServiceKey === supabaseAnonKey) {
        console.error("⛔ PERIGO: A SUPABASE_SERVICE_ROLE_KEY é igual à chave pública (ANON). O Admin Client não terá permissão para pular o RLS.");
    }

    // Cria o cliente ADMIN com a chave de serviço para ignorar regras RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        console.log(`🔍 [Pagamento] Buscando dados para ID: ${participanteId}`);

        if (!participanteId || isNaN(participanteId)) {
            return { success: false, error: 'ID do participante inválido.' };
        }

        // 1. Busca Participante
        const { data: participante, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('*')
            .eq('id', participanteId)
            .maybeSingle();

        if (partError) {
            console.error('❌ [Pagamento] Erro ao buscar participante:', JSON.stringify(partError, null, 2));
            return { success: false, error: `Erro no banco: ${partError.message}` };
        }

        if (!participante) {
            // Debug: Verificar se conseguimos ver ALGUMA coisa
            const { count } = await supabaseAdmin.from('participantes_rifa').select('*', { count: 'exact', head: true });
            console.error(`❌ [Pagamento] Participante ${participanteId} não encontrado. Total de linhas visíveis pelo Admin: ${count}`);

            return { success: false, error: 'Reserva não encontrada. (ID inexistente ou erro de permissão)' };
        }

        // 2. Busca Rifa Associada
        const { data: rifa, error: rifaError } = await supabaseAdmin
            .from('rifas')
            .select('*')
            .eq('id', participante.rifa_id)
            .single();

        if (rifaError) {
            console.error('❌ [Pagamento] Erro ao buscar rifa:', rifaError);
            return { success: false, error: 'Rifa associada não encontrada.' };
        }

        console.log("✅ [Pagamento] Dados carregados com sucesso para:", participante.nome);

        return { success: true, participante, rifa };

    } catch (error: any) {
        console.error('❌ [Pagamento] Erro inesperado:', error);
        return { success: false, error: error.message || 'Erro desconhecido no servidor.' };
    }
}