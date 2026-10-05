'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';

/**
 * Força o Next.js a limpar todos os caches que possuem a tag 'campaign'.
 * Isso é chamado sempre que o painel admin alterar os dados da campanha no Supabase,
 * garantindo que a página principal (onde CampaignBannerServer é renderizado) reflita instantaneamente.
 */
export async function revalidateCampaignCache() {
    if (!await isAdminAuthenticated()) {
        return { success: false, error: 'Não autorizado.' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
