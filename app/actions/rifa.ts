'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('AVISO: SUPABASE_SERVICE_ROLE_KEY não definida. Usando chave anônima. Algumas ações administrativas podem falhar se não houver permissão RLS.');
}

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
