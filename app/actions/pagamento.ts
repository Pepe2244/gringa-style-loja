'use server';

import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { verifyPaymentAccessToken } from '@/lib/payment-access';

export async function getPaymentDetails(participanteId: number, accessToken: string) {
    try {
        if (!Number.isSafeInteger(participanteId) || participanteId <= 0) {
            return { success: false, error: 'ID do participante inválido.' };
        }
        if (typeof accessToken !== 'string' || !verifyPaymentAccessToken(participanteId, accessToken)) {
            return { success: false, error: 'Acesso à reserva inválido ou expirado. Refaça a reserva ou contate o suporte.' };
        }
        const supabaseAdmin = createSupabaseAdminClient();

        // 1. Busca Participante
        const { data: participante, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('*')
            .eq('id', participanteId)
            .single();

        if (partError) {
            console.error('❌ [Pagamento] Erro Supabase:', JSON.stringify(partError, null, 2));

            // PGRST116: JSON object requested, multiple (or no) rows returned
            if (partError.code === 'PGRST116') {
                return {
                    success: false,
                    error: 'Reserva expirada ou não encontrada. Verifique o código e tente novamente.'
                };
            }

            // Tratamento genérico para outros erros (permissão, conexão, etc)
            return { success: false, error: 'Ocorreu um erro técnico ao processar sua reserva. Por favor, contate o suporte.' };
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
        return { success: false, error: 'Ocorreu um erro técnico ao processar sua reserva. Por favor, contate o suporte.' };
    }
}