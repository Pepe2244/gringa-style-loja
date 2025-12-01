'use server';

import { createClient } from '@supabase/supabase-js';

export async function getPaymentDetails(participanteId: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log(`🚀 [Pagamento] Iniciando busca para ID: ${participanteId}`);

    // --- CHECK DE SEGURANÇA E CONFIGURAÇÃO ---

    if (!supabaseServiceKey) {
        console.error("⛔ CRÍTICO: SUPABASE_SERVICE_ROLE_KEY vazia.");
        return { success: false, error: 'ERRO DE CONFIG: SUPABASE_SERVICE_ROLE_KEY não está no arquivo .env.local' };
    }

    // VERIFICAÇÃO: A chave secreta é igual à pública? (ERRO COMUM)
    // Se forem iguais, o admin client não funciona como admin.
    if (supabaseServiceKey === supabaseAnonKey) {
        console.error("⛔ PERIGO: Chave Service Role é IGUAL à chave Anon.");
        return {
            success: false,
            error: 'CONFIGURAÇÃO ERRADA: Sua SUPABASE_SERVICE_ROLE_KEY é igual à chave pública (ANON). Vá no painel do Supabase > Settings > API e copie a chave "service_role" (secret).'
        };
    }

    // --- FIM DO CHECK ---

    // Cria o cliente ADMIN com a chave de serviço para ignorar regras RLS
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
                return {
                    success: false,
                    error: `Reserva ${participanteId} não encontrada. (O banco bloqueou a leitura ou o ID não existe).`
                };
            }
            if (partError.code === '42501') {
                return { success: false, error: 'Erro de Permissão (RLS). A chave SERVICE_ROLE não está funcionando.' };
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