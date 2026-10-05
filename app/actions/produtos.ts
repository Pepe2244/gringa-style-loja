'use server'

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';

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

        return { success: true };
    } catch (error) {
        console.error('Erro crítico ao revalidar cache:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}