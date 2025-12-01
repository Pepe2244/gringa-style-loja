'use server';

import { createClient } from '@supabase/supabase-js';

export async function getPaymentDetails(participanteId: number) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // VERIFICAÇÃO BRUTAL: Sem chave de serviço, sem negócio.
    if (!supabaseServiceKey) {
        console.error("CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não está definida no servidor.");
        return { success: false, error: 'Erro de configuração no servidor (Chave de API).' };
    }

    // Cria o cliente ADMIN que ignora RLS
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

        // Fetch participant
        const { data: participante, error: partError } = await supabaseAdmin
            .from('participantes_rifa')
            .select('*')
            .eq('id', participanteId)
            .single();

        if (partError) {
            console.error('Erro ao buscar participante (Admin):', partError);
            return { success: false, error: 'Participante não encontrado no banco de dados.' };
        }

        // Fetch associated raffle
        const { data: rifa, error: rifaError } = await supabaseAdmin
            .from('rifas')
            .select('*')
            .eq('id', participante.rifa_id)
            .single();

        if (rifaError) {
            console.error('Erro ao buscar rifa (Admin):', rifaError);
            return { success: false, error: 'Rifa associada não encontrada.' };
        }

        return { success: true, participante, rifa };
    } catch (error: any) {
        console.error('Erro inesperado em getPaymentDetails:', error);
        return { success: false, error: error.message };
    }
}