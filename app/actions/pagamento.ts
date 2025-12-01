'use server';

import { createClient } from '@supabase/supabase-js';

export async function getPaymentDetails(participanteId: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        console.error("CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não está definida.");
        return { success: false, error: 'Erro de configuração no servidor (Chave de API).' };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // LOG PARA DEBUG
        console.log(`🔍 Buscando participante ID: ${participanteId} (Tipo: ${typeof participanteId})`);

        if (!participanteId || isNaN(participanteId)) {
            console.error("❌ ID inválido recebido:", participanteId);
            return { success: false, error: 'ID do participante inválido.' };
        }

        const { data: participante, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('*')
            .eq('id', participanteId)
            .single();

        if (partError) {
            // LOG DETALHADO DO ERRO
            console.error('❌ Erro Supabase (Participante):', JSON.stringify(partError, null, 2));
            return { success: false, error: 'Participante não encontrado no banco de dados.' };
        }

        console.log("✅ Participante encontrado:", participante.nome);

        const { data: rifa, error: rifaError } = await supabaseAdmin
            .from('rifas')
            .select('*')
            .eq('id', participante.rifa_id)
            .single();

        if (rifaError) {
            console.error('❌ Erro Supabase (Rifa):', rifaError);
            return { success: false, error: 'Rifa associada não encontrada.' };
        }

        return { success: true, participante, rifa };
    } catch (error: any) {
        console.error('❌ Erro inesperado em getPaymentDetails:', error);
        return { success: false, error: error.message };
    }
}