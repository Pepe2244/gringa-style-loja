import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildStorageUrl } from '@/lib/site-config';

// Força o Next.js a nunca fazer cache desta rota, garantindo dados em tempo real
export const dynamic = 'force-dynamic';

interface RecommendationRequest {
    productId: string;
    category: string;
    tags: string[];
    cartItems: string[];
    userHistory: string[];
    type: 'upsell' | 'cross-sell' | 'related' | 'frequently-bought-together';
    limit: number;
}

const RECOMMENDATION_FIELDS = 'id, nome, preco, preco_promocional, imagens, media_urls, categoria_id, tags';

type RecommendationRecord = {
    id: number | string;
    nome: string;
    preco: number;
    preco_promocional: number | null;
    imagens: string[] | null;
    media_urls: string[] | null;
    categoria_id?: number | null;
    tags: string[] | null;
};

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Dados de recomendação inválidos.' }, { status: 400 });
        }

        const input = body as Partial<RecommendationRequest>;
        const {
            productId,
            category = '',
            tags = [],
            cartItems = [],
            userHistory = [],
            type,
            limit = 4,
        } = input;

        const validStringArray = (value: unknown, maxItems: number, maxLength: number) =>
            Array.isArray(value) &&
            value.length <= maxItems &&
            value.every((item) => typeof item === 'string' && item.length <= maxLength);

        if (
            typeof productId !== 'string' || !/^\d{1,16}$/.test(productId) ||
            typeof category !== 'string' || category.length > 100 ||
            !validStringArray(tags, 20, 60) ||
            !validStringArray(cartItems, 50, 64) ||
            !validStringArray(userHistory, 50, 64) ||
            !['upsell', 'cross-sell', 'related', 'frequently-bought-together'].includes(type as string) ||
            !Number.isSafeInteger(limit) || limit < 1 || limit > 10
        ) {
            return NextResponse.json({ error: 'Parâmetros de recomendação inválidos.' }, { status: 400 });
        }

        const categoryId = Number(category);
        const parsedCategoryId = Number.isSafeInteger(categoryId) && categoryId > 0 ? categoryId : null;

        let products: RecommendationRecord[] = [];

        switch (type) {
            case 'upsell':
                products = await getUpsellProducts(parsedCategoryId, tags, limit);
                break;
            case 'cross-sell':
                products = await getCrossSellProducts(parsedCategoryId, tags, cartItems, limit);
                break;
            case 'related':
                products = await getRelatedProducts(parsedCategoryId, tags, productId, limit);
                break;
            case 'frequently-bought-together':
                products = await getFrequentlyBoughtTogether(productId, parsedCategoryId, limit);
                break;
            default:
                products = await getRelatedProducts(parsedCategoryId, tags, productId, limit);
        }

        return NextResponse.json({ products: products.map(toRecommendationProduct) });
    } catch (error) {
        console.error('Erro na API de recomendações:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor ao gerar recomendações.' },
            { status: 500 }
        );
    }
}

// Produtos premium da mesma categoria (upsell)
async function getUpsellProducts(categoryId: number | null, tags: string[], limit: number): Promise<RecommendationRecord[]> {
    let query = supabase
        .from('produtos')
        .select(RECOMMENDATION_FIELDS)
        .eq('em_estoque', true)
        .order('preco', { ascending: false })
        .limit(limit * 2);

    if (categoryId !== null) {
        query = query.eq('categoria_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    const prices = data.map(p => p.preco);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    const filtered = data.filter(product => product.preco >= avgPrice);
    return (filtered.length > 0 ? filtered : data).slice(0, limit);
}

// Produtos complementares baseados em tags e carrinho
async function getCrossSellProducts(categoryId: number | null, tags: string[], cartItems: string[], limit: number): Promise<RecommendationRecord[]> {
    const relatedTags = getRelatedTags(tags).slice(0, 8);

    let categoryQuery = supabase
        .from('produtos')
        .select(RECOMMENDATION_FIELDS)
        .eq('em_estoque', true)
        .order('preco', { ascending: false })
        .limit(limit * 2);

    if (categoryId !== null) {
        categoryQuery = categoryQuery.eq('categoria_id', categoryId);
    }

    const tagQueries = relatedTags.map((tag) =>
        supabase
            .from('produtos')
            .select(RECOMMENDATION_FIELDS)
            .eq('em_estoque', true)
            .contains('tags', [tag])
            .limit(limit * 2)
    );

    const results = await Promise.all([categoryQuery, ...tagQueries]);
    const failedQuery = results.find((result) => result.error);
    if (failedQuery?.error) throw failedQuery.error;

    const excludedIds = new Set(cartItems.map(String));
    const uniqueProducts = new Map<string, RecommendationRecord>();

    results.forEach(({ data }) => {
        data?.forEach((product: RecommendationRecord) => {
            if (!excludedIds.has(String(product.id))) {
                uniqueProducts.set(String(product.id), product);
            }
        });
    });

    return Array.from(uniqueProducts.values()).slice(0, limit);
}

// Produtos relacionados (mesma categoria e tags similares)
async function getRelatedProducts(categoryId: number | null, tags: string[], excludeId: string, limit: number): Promise<RecommendationRecord[]> {
    let query = supabase
        .from('produtos')
        .select(RECOMMENDATION_FIELDS)
        .eq('em_estoque', true)
        .limit(limit * 3);

    const numExcludeId = Number(excludeId);
    if (Number.isSafeInteger(numExcludeId) && numExcludeId > 0) {
        query = query.neq('id', numExcludeId);
    }

    if (categoryId !== null) {
        query = query.eq('categoria_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    const scoredProducts = data.map(product => ({
        ...product,
        score: calculateRelevanceScore(product.tags || [], tags)
    }));

    return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// Produtos frequentemente comprados juntos (fallback inteligente por categoria/tags)
async function getFrequentlyBoughtTogether(productId: string, categoryId: number | null, limit: number): Promise<RecommendationRecord[]> {
    if (categoryId !== null) {
        return getRelatedProducts(categoryId, [], productId, limit);
    }

    const numId = Number(productId);
    if (Number.isSafeInteger(numId) && numId > 0) {
        const { data: product } = await supabase
            .from('produtos')
            .select('categoria_id, tags')
            .eq('id', numId)
            .maybeSingle();

        if (product && product.categoria_id) {
            return getRelatedProducts(product.categoria_id, product.tags || [], productId, limit);
        }
    }

    return getRelatedProducts(null, [], productId, limit);
}

function toRecommendationProduct(product: RecommendationRecord) {
    const media = Array.isArray(product.media_urls) ? product.media_urls : product.imagens;
    let image = Array.isArray(media)
        ? media.find((url: unknown) => typeof url === 'string' && url.length > 0) || ''
        : '';

    if (image && !image.startsWith('http') && !image.startsWith('/')) {
        image = buildStorageUrl(image);
    }

    const hasPromo = typeof product.preco_promocional === 'number' &&
        product.preco_promocional > 0 &&
        product.preco_promocional < product.preco;

    return {
        id: String(product.id),
        nome: product.nome,
        preco: hasPromo ? product.preco_promocional : product.preco,
        preco_original: hasPromo ? product.preco : undefined,
        imagem_principal: image,
        categoria_id: product.categoria_id ?? null,
        tags: Array.isArray(product.tags) ? product.tags : [],
    };
}

function calculateRelevanceScore(productTags: string[], userTags: string[]): number {
    if (!productTags || !userTags || productTags.length === 0 || userTags.length === 0) return 0;
    const lowerUserTags = userTags.map(t => t.toLowerCase());
    const shared = productTags.filter(tag => lowerUserTags.includes(tag.toLowerCase()));
    return shared.length;
}

function getRelatedTags(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];

    // Mapeamento semântico voltado ao nicho de soldagem e EPIs
    const tagRelations: Record<string, string[]> = {
        'mascara': ['lente', 'carneira', 'filtro', 'capacete', 'solda'],
        'lente': ['mascara', 'visor', 'filtro', 'solda'],
        'tocha': ['bocal', 'difusor', 'eletrodo', 'pinça', 'consumivel'],
        'solda': ['tocha', 'mascara', 'luva', 'esquadro', 'eletrodo'],
        'tig': ['tocha', 'tungstenio', 'vareta', 'gas', 'bocal'],
        'mig': ['arame', 'bico', 'bocal', 'tocha', 'antirespingo'],
        'bota': ['perneira', 'luva', 'avental', 'epi', 'seguranca'],
        'luva': ['avental', 'mangote', 'perneira', 'bota', 'mascara'],
        'oculos': ['mascara', 'protetor', 'epi', 'lente'],
        'eletrodo': ['tocha', 'porta-eletrodo', 'cabo', 'garra'],
    };

    const relatedTags = new Set<string>();

    tags.forEach(tag => {
        const lower = tag.toLowerCase().trim();
        relatedTags.add(lower);
        const relations = tagRelations[lower] || [];
        relations.forEach(r => relatedTags.add(r));
    });

    return Array.from(relatedTags);
}