'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

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
            number: Number(data.number)
        };
        if (!winner.name || !Number.isSafeInteger(winner.number) || winner.number < 0) {
            throw new Error('O sorteio foi processado, mas os dados do vencedor estão incompletos.');
        }

        // 6. DESTRUIÇÃO DO CACHE: Atualizar vitrine e painel instantaneamente
        revalidatePath('/', 'layout');
        revalidatePath('/rifa', 'page');
        revalidatePath('/acompanhar-rifa', 'page');
        revalidatePath('/admin', 'layout');

        // Sucesso absoluto. Devolve o vencedor para a tela.
        return { success: true, winner };

    } catch (error) {
        console.error("Erro CRÍTICO no Sorteio Server Action:", error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro interno no sorteio.' };
    }
}