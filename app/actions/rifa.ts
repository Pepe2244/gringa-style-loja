'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRÍTICO: Variáveis de ambiente do Supabase não configuradas');
}

if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY não configurada, usando chave anônima para operações limitadas');
}

// Cliente ADMIN para operações privilegiadas (sorteio, etc)
const getAdminClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase incompleta');
    }

    if (supabaseServiceKey) {
        return createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } else {
        // Fallback para chave anônima se service key não estiver disponível
        console.warn('Usando chave anônima para operações admin - algumas funções podem falhar');
        return createClient(supabaseUrl, supabaseAnonKey);
    }
};

// Cliente PÚBLICO para operações de usuário (como reservar)
const getPublicClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase incompleta');
    }
    return createClient(supabaseUrl, supabaseAnonKey);
};

export async function reservarNumerosRifa(
    rifaId: number,
    numeros: number[],
    nome: string,
    telefone: string
) {
    const supabase = getAdminClient();

    try {
        // Validação de segurança no SERVIDOR: checa se a rifa já encerrou
        const { data: rifaCheck } = await supabase.from('rifas').select('status').eq('id', rifaId).single();
        if (rifaCheck && rifaCheck.status === 'finalizada') {
            throw new Error('CUIDADO: Tentativa de compra em rifa já encerrada e sorteada. Ação bloqueada.');
        }

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
        console.error('Erro ao gerenciar rifa (Server Action):', error);
        return { success: false, error: error.message };
    }
}

export async function deleteRaffle(id: number) {
    const supabase = getAdminClient();
    try {
        // 1. Excluir participantes (dependência FK)
        const { error: partError } = await supabase.from('participantes_rifa').delete().eq('rifa_id', id);
        if (partError) throw new Error('Erro ao excluir participantes: ' + partError.message);

        // 2. Excluir prêmios (dependência FK)
        const { error: prizeError } = await supabase.from('premios').delete().eq('rifa_id', id);
        if (prizeError) throw new Error('Erro ao excluir prêmios: ' + prizeError.message);

        // 3. Excluir a rifa
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