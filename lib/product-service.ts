import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { buildStorageUrl, isLegacyDeadStorageUrl, siteConfig } from '@/lib/site-config';
import { getCachedValue } from '@/lib/cache';

export const resolveAbsoluteUrl = (path?: string | null) => {
    if (!path || isLegacyDeadStorageUrl(path)) return `${siteConfig.appUrl}/imagens/logo_gringa_style.png`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${siteConfig.appUrl}${path}`;
    return buildStorageUrl(path);
};

// Cache local por execução/requisição para evitar chamadas redundantes em renderizações síncronas
let localProductsCache: any[] | null = null;
let localProductsCacheTime = 0;
let localCategoriesCache: any[] | null = null;
let localCategoriesCacheTime = 0;

export function clearProductServiceCache() {
    localProductsCache = null;
    localProductsCacheTime = 0;
    localCategoriesCache = null;
    localCategoriesCacheTime = 0;
}

export async function getAllActiveProducts() {
    const now = Date.now();
    if (localProductsCache && (now - localProductsCacheTime < 10000)) {
        return localProductsCache;
    }

    const products = await getCachedValue<any[]>(
        async () => {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('id', { ascending: false })
                .limit(2000);
            if (error) {
                console.error('[ProductService] Erro ao buscar produtos:', error);
                return [];
            }
            return data || [];
        },
        ['all-active-products-list'],
        ['produtos', 'loja'],
        60
    );

    localProductsCache = products;
    localProductsCacheTime = now;
    return products;
}

export async function getCachedCategories() {
    const now = Date.now();
    if (localCategoriesCache && (now - localCategoriesCacheTime < 10000)) {
        return localCategoriesCache;
    }

    const categories = await getCachedValue<any[]>(
        async () => {
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .order('nome');
            if (error) {
                console.error('[ProductService] Erro ao buscar categorias:', error);
                return [];
            }
            return data || [];
        },
        ['all-categories-list'],
        ['categorias', 'loja'],
        120
    );

    localCategoriesCache = categories;
    localCategoriesCacheTime = now;
    return categories;
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

    // 3. Fallback por ID estritamente numérico (ex: "23")
    if (/^\d+$/.test(decoded)) {
        const numId = parseInt(decoded, 10);
        if (Number.isSafeInteger(numId) && numId > 0) {
            const { data: byId } = await supabase
                .from('produtos')
                .select('*')
                .eq('id', numId)
                .maybeSingle();
            if (byId) return byId;
        }
    }

    // 4. RESOLUÇÃO DEFINITIVA ACCENT-INSENSITIVE (Slug ou Nome):
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

        // 5. Fallback por URL legada com prefixo de ID (ex: "23-oculos-steelflex")
        const legacyPrefixMatch = decoded.match(/^(\d+)-(.+)$/);
        if (legacyPrefixMatch) {
            const legacyId = parseInt(legacyPrefixMatch[1], 10);
            if (Number.isSafeInteger(legacyId) && legacyId > 0) {
                const candidate = allProducts.find((p: any) => p.id === legacyId);
                if (candidate) return candidate;
            }
        }

        // 6. Fallback por similaridade de tokens principais
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
