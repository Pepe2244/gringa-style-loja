'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('CRÍTICO: SUPABASE_SERVICE_ROLE_KEY ausente em app/actions/rifa.ts');
}

// Cliente ADMIN para operações privilegiadas
const getAdminClient = () => {
    return createClient(supabaseUrl, supabaseServiceKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

// Cliente PÚBLICO para operações de usuário (como reservar)
const getPublicClient = () => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, anonKey);
};

export async function reservarNumerosRifa(
    rifaId: number,
    numeros: number[],
    nome: string,
    telefone: string
) {
    // Usa cliente público/anon para respeitar regras do banco se houver, 
    // mas aqui estamos chamando uma RPC 'security definer', então tanto faz.
    // Usaremos o Admin para garantir que a conexão funcione independente de RLS na tabela.
    const supabase = getAdminClient();

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

// --- NOVAS AÇÕES ADMINISTRATIVAS ---

export async function manageRaffle(rifaData: any, premios: any[]) {
    const supabase = getAdminClient();

    try {
        let rifaId = rifaData.id;

        // 1. Salvar ou Atualizar Rifa
        if (rifaId) {
            const { error } = await supabase.from('rifas').update(rifaData).eq('id', rifaId);
            if (error) throw new Error('Erro ao atualizar rifa: ' + error.message);
        } else {
            const { data, error } = await supabase.from('rifas').insert([rifaData]).select().single();
            if (error) throw new Error('Erro ao criar rifa: ' + error.message);
            rifaId = data.id;
        }

        // 2. Sincronizar Prêmios
        // Primeiro, limpamos prêmios que não estão mais na lista (se for edição)
        if (rifaData.id) {
            const { data: existing } = await supabase.from('premios').select('id').eq('rifa_id', rifaId);
            const existingIds = existing?.map(p => p.id) || [];
            const incomingIds = premios.map(p => p.id).filter(Boolean);
            const toDelete = existingIds.filter(id => !incomingIds.includes(id));

            if (toDelete.length > 0) {
                await supabase.from('premios').delete().in('id', toDelete);
            }
        }

        // Preparar prêmios para upsert
        const premiosToSave = premios.map((p, index) => ({
            ...p,
            rifa_id: rifaId,
            ordem: index + 1
        }));

        if (premiosToSave.length > 0) {
            const { error: premiosError } = await supabase.from('premios').upsert(premiosToSave);
            if (premiosError) throw new Error('Erro ao salvar prêmios: ' + premiosError.message);
        }

        return { success: true, rifaId };
    } catch (error: any) {
        console.error('Erro em manageRaffle:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteRaffle(id: number) {
    const supabase = getAdminClient();
    try {
        const { error } = await supabase.from('rifas').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleRaffleStatus(id: number, currentStatus: string) {
    const supabase = getAdminClient();
    const newStatus = currentStatus === 'ativa' ? 'finalizada' : 'ativa';

    try {
        const { error } = await supabase.from('rifas').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        return { success: true, newStatus };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}