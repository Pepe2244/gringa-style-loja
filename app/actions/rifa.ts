'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role Key for backend actions if available, or Anon if RLS allows. 
// Ideally, we should use a Service Role client for admin tasks, but for user actions, RLS should handle it.
// However, the user asked to move logic to Server Action for security/auditability.
// Using standard client with anon key is fine if RLS is set, but "auditability" implies we might want to log it securely.
// Let's use the standard client for now, but running on server.

const supabase = createClient(supabaseUrl, supabaseKey);

export async function reservarNumerosRifa(
    rifaId: number,
    numeros: number[],
    nome: string,
    telefone: string
) {
    try {
        const { data, error } = await supabase.rpc('reservar_numeros_rifa', {
            id_rifa_param: rifaId,
            numeros_escolhidos_param: numeros,
            nome_cliente_param: nome,
            telefone_param: telefone
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Erro ao reservar rifa (Server Action):', error);
        return { success: false, error: error.message };
    }
}
