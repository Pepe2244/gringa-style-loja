export const PRONTA_ENTREGA_TAG = '__pronta_entrega__';

const LEGACY_PRONTA_ENTREGA_TAGS = new Set([
    PRONTA_ENTREGA_TAG,
    'pronta_entrega',
    'pronta-entrega',
    'pronta entrega',
]);

export function isProntaEntrega(product?: { tags?: string[] | null; pronta_entrega?: boolean | null } | null): boolean {
    if (!product) return false;
    if (typeof product.pronta_entrega === 'boolean') {
        return product.pronta_entrega;
    }
    if (!Array.isArray(product.tags)) return false;
    return product.tags.some(
        (tag) => typeof tag === 'string' && LEGACY_PRONTA_ENTREGA_TAGS.has(tag.trim().toLowerCase())
    );
}

export function stripAvailabilityTags(tags?: string[] | null): string[] {
    if (!Array.isArray(tags)) return [];
    return tags.filter(
        (tag) => typeof tag === 'string' && !LEGACY_PRONTA_ENTREGA_TAGS.has(tag.trim().toLowerCase())
    );
}

export function applyProntaEntregaToTags(tags: string[], prontaEntrega: boolean): string[] {
    const clean = stripAvailabilityTags(tags);
    if (prontaEntrega) {
        return [...clean.slice(0, 49), PRONTA_ENTREGA_TAG];
    }
    return clean.slice(0, 50);
}

/**
 * Retorna texto pesquisável de tags e disponibilidade sem expor a tag técnica `__pronta_entrega__`.
 */
export function getSearchableAvailabilityText(
    product?: { tags?: string[] | null; pronta_entrega?: boolean | null; em_estoque?: boolean | null } | null
): string {
    if (!product) return '';
    const baseTags = stripAvailabilityTags(product.tags).join(' ');
    if (!product.em_estoque) {
        return baseTags;
    }
    const availabilityTerms = isProntaEntrega(product)
        ? 'pronta entrega pronta-entrega'
        : 'sob encomenda sob-encomenda';
    return [baseTags, availabilityTerms].filter(Boolean).join(' ');
}
