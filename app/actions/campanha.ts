'use server';

import { revalidatePath } from 'next/cache';

/**
 * Força o Next.js a limpar todos os caches que possuem a tag 'campaign'.
 * Isso é chamado sempre que o painel admin alterar os dados da campanha no Supabase,
 * garantindo que a página principal (onde CampaignBannerServer é renderizado) reflita instantaneamente.
 */
export async function revalidateCampaignCache() {
    revalidatePath('/', 'layout');
    return { success: true };
}
