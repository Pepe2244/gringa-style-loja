'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateProductCache() {
    try {
        // Invalida o cache global da loja inteira sempre que o estoque ou catálogo mudar.
        // Isso garante que os sitemaps, homepage e páginas dos produtos reflitam as mudanças em menos de 1 segundo.
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (error) {
        console.error('Erro ao revalidar cache:', error)
        return { success: false, error: error.message }
    }
}
