'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createPaymentAccessToken } from '@/lib/payment-access';

export async function reservarNumerosRifa(
    rifaId: number,
    numeros: number[],
    nome: string,
    telefone: string
) {
    try {
        if (!Number.isSafeInteger(rifaId) || rifaId <= 0) throw new Error('Rifa inválida.');
        if (!Array.isArray(numeros) || numeros.length === 0 || numeros.length > 100 ||
            !numeros.every((numero) => Number.isSafeInteger(numero) && numero >= 0) ||
            new Set(numeros).size !== numeros.length) {
            throw new Error('Selecione números válidos e sem duplicação.');
        }
        if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 120) {
            throw new Error('Informe um nome válido.');
        }
        if (typeof telefone !== 'string' || !/^[+\d ()-]{8,24}$/.test(telefone)) {
            throw new Error('Informe um telefone válido.');
        }
        const supabase = createSupabaseAdminClient();

        // Validação de segurança no SERVIDOR: checa se a rifa já encerrou
        const { data: rifaCheck, error: rifaError } = await supabase.from('rifas').select('status').eq('id', rifaId).single();
        if (rifaError) throw rifaError;
        if (rifaCheck.status !== 'ativa') {
            throw new Error('CUIDADO: Tentativa de compra em rifa já encerrada e sorteada. Ação bloqueada.');
        }

        const { data, error } = await supabase.rpc('reservar_numeros_rifa', {
            id_rifa_param: rifaId,
            numeros_escolhidos_param: numeros,
            nome_cliente_param: nome,
            telefone_param: telefone
        });

        if (error) throw error;
        const participantId = Array.isArray(data)
            ? Number(data[0]?.participante_id ?? data[0]?.id ?? data[0])
            : Number(data && typeof data === 'object' ? data.participante_id ?? data.id : data);
        if (!Number.isSafeInteger(participantId) || participantId <= 0) {
            throw new Error('A reserva foi processada, mas não foi possível gerar o acesso de pagamento. Entre em contato com o suporte.');
        }

        // OBLITERAÇÃO DE CACHE: Garante que os números sumam da tela dos outros usuários instantaneamente
        revalidatePath('/rifa', 'layout');
        revalidatePath('/acompanhar-rifa', 'page');
        revalidatePath('/admin', 'layout');

        return { success: true, data, paymentToken: createPaymentAccessToken(participantId) };
    } catch (error: any) {
        console.error('Erro ao reservar rifa (Server Action):', error);
        return { success: false, error: error.message };
    }
}

// --- NOVAS AÇÕES ADMINISTRATIVAS ---

export async function manageRaffle(rifaData: any, premios: any[]) {
    if (!await isAdminAuthenticated()) return { success: false, error: 'Não autorizado.' };

    try {
        const supabase = createSupabaseAdminClient();
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

        // OBLITERAÇÃO DE CACHE: Garante que a nova rifa ou edições apareçam na loja
        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'layout');
        revalidatePath('/admin', 'layout');

        return { success: true, rifaId };
    } catch (error: any) {
        console.error('Erro ao gerenciar rifa (Server Action):', error);
        return { success: false, error: error.message };
    }
}

export async function deleteRaffle(id: number) {
    if (!await isAdminAuthenticated()) return { success: false, error: 'Não autorizado.' };

    try {
        const supabase = createSupabaseAdminClient();
        // 1. Excluir participantes (dependência FK)
        const { error: partError } = await supabase.from('participantes_rifa').delete().eq('rifa_id', id);
        if (partError) throw new Error('Erro ao excluir participantes: ' + partError.message);

        // 2. Excluir prêmios (dependência FK)
        const { error: prizeError } = await supabase.from('premios').delete().eq('rifa_id', id);
        if (prizeError) throw new Error('Erro ao excluir prêmios: ' + prizeError.message);

        // 3. Excluir a rifa
        const { error } = await supabase.from('rifas').delete().eq('id', id);
        if (error) throw error;

        // OBLITERAÇÃO DE CACHE: Remove a rifa deletada da interface imediatamente
        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'layout');
        revalidatePath('/admin', 'layout');

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleRaffleStatus(id: number, currentStatus: string) {
    if (!await isAdminAuthenticated()) return { success: false, error: 'Não autorizado.' };

    const supabase = createSupabaseAdminClient();
    const newStatus = currentStatus === 'ativa' ? 'finalizada' : 'ativa';

    try {
        const { error } = await supabase.from('rifas').update({ status: newStatus }).eq('id', id);
        if (error) throw error;

        // OBLITERAÇÃO DE CACHE: Reflete a mudança de status na vitrine
        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'layout');
        revalidatePath('/admin', 'layout');

        return { success: true, newStatus };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}