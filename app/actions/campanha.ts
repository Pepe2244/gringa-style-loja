'use server';

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
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

    try {
        revalidateTag('campaign', 'max');
        if (typeof updateTag === 'function') {
            updateTag('campaign');
        }
    } catch (err) {
        console.error('Falha ao revalidar tags de campanha:', err);
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
    return { success: true };
}
