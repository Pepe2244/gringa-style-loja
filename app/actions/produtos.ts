'use server'

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { submitToIndexNow } from '@/lib/indexnow';
import { clearProductServiceCache } from '@/lib/product-service';

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

        // Notificação IndexNow em segundo plano (não bloqueante)
        submitToIndexNow().catch((err) => {
            console.error('[IndexNow] Falha na submissão em background:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('Erro crítico ao revalidar cache:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}