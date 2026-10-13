import { buildStorageUrl, getStorageBaseUrl } from '@/lib/site-config';

/**
 * Retorna a URL válida para exibição de mídias e imagens.
 * Não converte mais para /supabase-assets/ (que gerava 404),
 * e recupera URLs antigas que porventura contenham esse prefixo.
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Se foi passada uma URL com o prefixo quebrado /supabase-assets/, recupera para a URL real do Supabase
    if (url.startsWith('/supabase-assets/')) {
        const cleanPath = url.replace(/^\/supabase-assets\//, '');
        return `${getStorageBaseUrl()}/${cleanPath}`;
    }

    // Se já é uma URL completa ou asset estático local
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url;
    }

    // Se for um caminho relativo de arquivo no bucket
    return buildStorageUrl(url);
}

export function toStorageUrl(path: string) {
    return buildStorageUrl(path);
}
