import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { buildStorageUrl, siteConfig } from '@/lib/site-config';

export const resolveAbsoluteUrl = (path?: string | null) => {
    if (!path) return `${siteConfig.appUrl}/imagens/logo_gringa_style.png`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${siteConfig.appUrl}${path}`;
    return buildStorageUrl(path);
};

// Cache em memória compartilhado para evitar queries repetidas ao banco durante o ciclo de renderização
let allProductsCache: any[] | null = null;
let allProductsCacheTime = 0;

export function clearProductServiceCache() {
    allProductsCache = null;
    allProductsCacheTime = 0;
}

export async function getAllActiveProducts() {
    const now = Date.now();
    if (allProductsCache && (now - allProductsCacheTime < 60000)) {
        return allProductsCache;
    }
    const { data } = await supabase
        .from('produtos')
        .select('*')
        .limit(500);
    allProductsCache = data || [];
    allProductsCacheTime = now;
    return allProductsCache;
}


// Normaliza uma string para comparação fonética/de slug (remove acentos, pontuações e hifens extras)
export function normalizeSlugCompare(str: string): string {
    return (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const fetchProductBySlugOrId = cache(async (rawSlugOrId: string) => {
    const raw = (rawSlugOrId || '').trim();
    if (!raw) return null;

    let decoded = raw;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        decoded = raw;
    }

    // 1. Busca exata pelo slug oficial no banco
    const { data: exactProduct } = await supabase
        .from('produtos')
        .select('*')
        .eq('slug', decoded)
        .maybeSingle();

    if (exactProduct) return exactProduct;

    // 2. Busca limpando traços duplicados ou nas extremidades
    const cleanedSlug = decoded.replace(/^-+|-+$/g, '').replace(/-+/g, '-');
    if (cleanedSlug && cleanedSlug !== decoded) {
        const { data: byClean } = await supabase
            .from('produtos')
            .select('*')
            .eq('slug', cleanedSlug)
            .maybeSingle();
        if (byClean) return byClean;
    }

    // 3. Fallback por ID numérico (ex: "23" ou "23-oculos-steelflex")
    const idMatch = decoded.match(/^(\d+)/);
    if (idMatch) {
        const numId = parseInt(idMatch[1], 10);
        if (!isNaN(numId)) {
            const { data: legacyProduct } = await supabase
                .from('produtos')
                .select('*')
                .eq('id', numId)
                .maybeSingle();
            if (legacyProduct) return legacyProduct;
        }
    }

    // 4. RESOLUÇÃO DEFINITIVA ACCENT-INSENSITIVE:
    const targetNorm = normalizeSlugCompare(decoded);
    if (targetNorm) {
        const allProducts = await getAllActiveProducts();
        const found = allProducts.find((p: any) => {
            if (!p) return false;
            if (p.slug && normalizeSlugCompare(p.slug) === targetNorm) return true;
            if (p.nome && normalizeSlugCompare(p.nome) === targetNorm) return true;
            const legacyStripped = (p.nome || '')
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            if (legacyStripped && legacyStripped === targetNorm) return true;
            return false;
        });

        if (found) return found;

        // 5. Fallback por similaridade de tokens principais
        const stopWords = new Set(['de', 'da', 'do', 'em', 'para', 'com', 'sem', 'style', 'gringa', 'a', 'o', 'e']);
        const tokens = targetNorm
            .split('-')
            .filter(t => t.length > 2 && !stopWords.has(t));

        if (tokens.length >= 2) {
            const candidate = allProducts.find((p: any) => {
                const normName = normalizeSlugCompare(p.nome || '');
                return tokens.every(token => normName.includes(token));
            });
            if (candidate) return candidate;
        }
    }

    return null;
});
