'use server'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { submitToIndexNow } from '@/lib/indexnow';
import { clearProductServiceCache } from '@/lib/product-service';
import { getCanonicalProductSlug } from '@/utils/slugify';
import { siteConfig } from '@/lib/site-config';

export async function revalidateProductCache() {
    if (!await isAdminAuthenticated()) {
        return { success: false, error: 'Não autorizado.' };
    }

    try {
        clearProductServiceCache();

        try {
            revalidateTag('produtos', 'max');
            revalidateTag('loja', 'max');
            revalidateTag('categorias', 'max');
            if (typeof updateTag === 'function') {
                updateTag('produtos');
                updateTag('loja');
                updateTag('categorias');
            }
        } catch (e) {
            console.error('[Cache] Falha ao revalidar tags:', e);
        }

        // Obliteração do Cache do Next.js (App Router)
        revalidatePath('/', 'layout');
        revalidatePath('/loja', 'page');
        revalidatePath('/loja', 'layout');
        revalidatePath('/categoria/[id]', 'page');
        revalidatePath('/categoria', 'layout');
        revalidatePath('/produto/[id]', 'page');
        revalidatePath('/busca', 'page');
        revalidatePath('/carrinho', 'page');
        revalidatePath('/admin', 'layout');

        const productCanonicalUrls: string[] = [];

        // Revalidação pontual de cada produto individual
        try {
            const { createSupabaseAdminClient } = await import('@/lib/supabase-admin');
            const adminClient = createSupabaseAdminClient();
            const { data: allProds } = await adminClient.from('produtos').select('id, nome, slug');
            if (allProds) {
                for (const p of allProds) {
                    const canonicalSlug = getCanonicalProductSlug(p);
                    revalidatePath(`/produto/${canonicalSlug}`, 'page');
                    if (p.slug && p.slug !== canonicalSlug) revalidatePath(`/produto/${p.slug}`, 'page');
                    if (p.id) revalidatePath(`/produto/${p.id}`, 'page');
                    productCanonicalUrls.push(`${siteConfig.appUrl}/produto/${canonicalSlug}`);
                }
            }
        } catch (indErr) {
            console.warn('[Cache] Revalidação individual de produtos ignorada:', indErr);
        }

        // Notificação IndexNow em segundo plano (não bloqueante e com cooldown anti-429)
        const urlsToSubmit = [
            `${siteConfig.appUrl}/`,
            `${siteConfig.appUrl}/loja`,
            `${siteConfig.appUrl}/rifa`,
            `${siteConfig.appUrl}/historico`,
            `${siteConfig.appUrl}/sobre`,
            `${siteConfig.appUrl}/gs-servicos-industriais`,
            `${siteConfig.appUrl}/devolucao-e-reembolso`,
            `${siteConfig.appUrl}/privacidade`,
            `${siteConfig.appUrl}/categoria/4`,
            `${siteConfig.appUrl}/categoria/5`,
            `${siteConfig.appUrl}/categoria/6`,
            `${siteConfig.appUrl}/categoria/7`,
            `${siteConfig.appUrl}/categoria/8`,
            ...productCanonicalUrls,
        ];

        submitToIndexNow(urlsToSubmit, { isBackground: true }).catch((err) => {
            console.error('[IndexNow] Falha na submissão em background:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('Erro crítico ao revalidar cache:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
