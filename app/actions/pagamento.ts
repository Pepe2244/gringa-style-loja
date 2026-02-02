'use server';

import { createClient } from '@supabase/supabase-js';

export async function getPaymentDetails(participanteId: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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