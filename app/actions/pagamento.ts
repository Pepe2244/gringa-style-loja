'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use Service Role Key if available to bypass RLS, otherwise fallback to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getPaymentDetails(participanteId: number) {
    try {
        // Fetch participant
        const { data: participante, error: partError } = await supabase
            .from('participantes_rifa')
            .select('*')
            .eq('id', participanteId)
            .single();

        if (partError) {
            console.error('Error fetching participant:', partError);
            return { success: false, error: 'Participante não encontrado' };
        }

        // Fetch associated raffle
        const { data: rifa, error: rifaError } = await supabase
            .from('rifas')
            .select('*')
            .eq('id', participante.rifa_id)
            .single();

        if (rifaError) {
            console.error('Error fetching raffle:', rifaError);
            return { success: false, error: 'Rifa não encontrada' };
        }

        return { success: true, participante, rifa };
    } catch (error: any) {
        console.error('Unexpected error in getPaymentDetails:', error);
        return { success: false, error: error.message };
    }
}
