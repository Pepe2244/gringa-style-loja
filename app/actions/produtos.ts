'use server'

import { revalidatePath } from 'next/cache';
import { clearAllCache } from '@/lib/cache';

export async function revalidateProductCache() {
    try {
        // 1. Obliteração do Cache do Next.js (App Router)
        // Não confie apenas no layout da home. Ataque as rotas específicas.
        revalidatePath('/', 'layout');          // Home e componentes globais
        revalidatePath('/produto', 'layout');   // Todas as páginas de produtos
        revalidatePath('/busca', 'page');       // Resultados de busca e filtros
        revalidatePath('/carrinho', 'page');    // Evita itens fantasmas no checkout
        revalidatePath('/admin', 'layout');     // Sincroniza o painel instantaneamente

        // 2. Obliteração do seu Cache Customizado em Memória
        clearAllCache();

        return { success: true };
    } catch (error) {
        console.error('Erro crítico ao revalidar cache:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}