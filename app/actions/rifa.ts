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

function safeRaffleUrl(value: unknown, name: string): string | null {
    if (value == null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (str.startsWith('/') && !str.startsWith('//')) return str;
    let url: URL;
    try {
        url = new URL(str);
    } catch {
        throw new Error(`${name} inválida.`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`${name} inválida.`);
    }
    return url.toString();
}

export async function manageRaffle(rifaData: unknown, premios: unknown[]) {
    if (!await isAdminAuthenticated()) return { success: false, error: 'Não autorizado.' };

    try {
        const supabase = createSupabaseAdminClient();
        if (!rifaData || typeof rifaData !== 'object' || Array.isArray(rifaData)) {
            throw new Error('Dados da rifa inválidos.');
        }
        if (!Array.isArray(premios) || premios.length > 20) throw new Error('Lista de prêmios inválida.');

        const input = rifaData as Record<string, unknown>;
        const raffleId = input.id == null ? null : Number(input.id);
        if (raffleId !== null && (!Number.isSafeInteger(raffleId) || raffleId <= 0)) {
            throw new Error('Identificador da rifa inválido.');
        }
        const status = input.status ?? 'ativa';
        if (!['ativa', 'finalizada', 'cancelada'].includes(String(status))) {
            throw new Error('Status da rifa inválido.');
        }
        const imageUrl = safeRaffleUrl(input.imagem_premio_url, 'Imagem da rifa');

        const rafflePayload = {
            id: raffleId,
            nome_premio: typeof input.nome_premio === 'string' ? input.nome_premio.trim() : '',
            descricao: typeof input.descricao === 'string' ? input.descricao.trim() : '',
            preco_numero: Number(input.preco_numero),
            preco_numero_desconto_quantidade: input.preco_numero_desconto_quantidade == null
                ? null
                : Number(input.preco_numero_desconto_quantidade),
            preco_numero_desconto: input.preco_numero_desconto == null
                ? null
                : Number(input.preco_numero_desconto),
            total_numeros: Number(input.total_numeros),
            imagem_premio_url: imageUrl,
            status
        };
        if (!rafflePayload.nome_premio || rafflePayload.nome_premio.length > 200 ||
            !rafflePayload.descricao || rafflePayload.descricao.length > 5000 ||
            !Number.isFinite(rafflePayload.preco_numero) || rafflePayload.preco_numero <= 0 ||
            !Number.isSafeInteger(rafflePayload.total_numeros) || rafflePayload.total_numeros < 1 ||
            rafflePayload.total_numeros > 1_000_000 ||
            (rafflePayload.preco_numero_desconto_quantidade !== null &&
                (!Number.isSafeInteger(rafflePayload.preco_numero_desconto_quantidade) || rafflePayload.preco_numero_desconto_quantidade < 1)) ||
            (rafflePayload.preco_numero_desconto !== null &&
                (!Number.isFinite(rafflePayload.preco_numero_desconto) || rafflePayload.preco_numero_desconto < 0))) {
            throw new Error('Confira os dados e os valores da rifa.');
        }

        const prizePayload = premios.map((value) => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Prêmio inválido.');
            const prize = value as Record<string, unknown>;
            const id = prize.id == null ? null : Number(prize.id);
            if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) throw new Error('Identificador de prêmio inválido.');
            const description = typeof prize.descricao === 'string' ? prize.descricao.trim() : '';
            if (!description || description.length > 300) throw new Error('Descrição de prêmio inválida.');
            const prizeImage = safeRaffleUrl(prize.imagem_url, 'Imagem de prêmio');
            return { id, descricao: description, imagem_url: prizeImage };
        });
        const { data: rifaId, error } = await supabase.rpc('admin_save_raffle_with_prizes', {
            p_raffle: rafflePayload,
            p_prizes: prizePayload
        });
        if (error) throw error;

        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'layout');
        revalidatePath('/admin', 'layout');

        return { success: true, rifaId: Number(rifaId) };
    } catch (error) {
        console.error('Erro ao gerenciar rifa (Server Action):', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno.' };
    }
}

export async function deleteRaffle(id: number) {
    if (!await isAdminAuthenticated()) return { success: false, error: 'Não autorizado.' };

    try {
        const supabase = createSupabaseAdminClient();
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Identificador da rifa inválido.');
        const { error } = await supabase.rpc('admin_delete_raffle', { p_rifa_id: id });
        if (error) throw error;

        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'layout');
        revalidatePath('/admin', 'layout');

        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir rifa:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erro interno.' };
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

export async function drawWinner(rifaId: number, prizeId: number) {
    if (!await isAdminAuthenticated()) {
        return { success: false, message: 'Não autorizado.' };
    }

    try {
        if (!Number.isSafeInteger(rifaId) || rifaId <= 0 || !Number.isSafeInteger(prizeId) || prizeId <= 0) {
            throw new Error('Identificador da rifa ou do prêmio inválido.');
        }
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase.rpc('admin_draw_raffle_winner', {
            p_rifa_id: rifaId,
            p_premio_id: prizeId
        });
        if (error) throw error;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('O sorteio foi processado, mas os dados do vencedor estão inválidos.');
        }
        const winner = {
            name: String(data.name),
            phone: String(data.phone),
            number: Number(data.number),
            remainingPrizes: Number(data.remaining_prizes ?? 0),
            raffleFinalized: Boolean(data.raffle_finalized ?? true),
        };
        if (!winner.name || !Number.isSafeInteger(winner.number) || winner.number < 0) {
            throw new Error('O sorteio foi processado, mas os dados do vencedor estão incompletos.');
        }

        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'page');
        revalidatePath('/acompanhar-rifa', 'page');
        revalidatePath('/admin', 'layout');

        return { success: true, winner };
    } catch (error) {
        console.error("Erro no sorteio da rifa:", error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro interno no sorteio.' };
    }
}