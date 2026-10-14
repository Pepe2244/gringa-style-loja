'use server'

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { submitToIndexNow } from '@/lib/indexnow';

export async function revalidateProductCache() {
    if (!await isAdminAuthenticated()) {
        return { success: false, error: 'Não autorizado.' };
    }

    try {
        // 1. Obliteração do Cache do Next.js (App Router)
        // Ataque direto às rotas específicas.
        revalidatePath('/', 'layout');          // Home e componentes globais
        revalidatePath('/produto', 'layout');   // Todas as páginas de produtos
        revalidatePath('/busca', 'page');       // Resultados de busca e filtros
        revalidatePath('/carrinho', 'page');    // Evita itens fantasmas no checkout
        revalidatePath('/admin', 'layout');     // Sincroniza o painel instantaneamente

        // 2. Notificação IndexNow em segundo plano (não bloqueante)
        submitToIndexNow().catch((err) => {
            console.error('[IndexNow] Falha na submissão em background:', err);
        });

        return { success: true };
    } catch (error) {
        console.error('Erro crítico ao revalidar cache:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}