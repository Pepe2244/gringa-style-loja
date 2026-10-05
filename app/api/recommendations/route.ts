import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

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

const RECOMMENDATION_FIELDS = 'id, nome, preco, preco_promocional, imagens, media_urls, categoria, tags, total_vendas';

type RecommendationRecord = {
    id: number | string;
    nome: string;
    preco: number;
    preco_promocional: number | null;
    imagens: string[] | null;
    media_urls: string[] | null;
    categoria?: string | null;
    tags: string[] | null;
    total_vendas?: number | null;
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
            category,
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
            !validStringArray(tags, 20, 40) ||
            !validStringArray(cartItems, 50, 64) ||
            !validStringArray(userHistory, 50, 64) ||
            !['upsell', 'cross-sell', 'related', 'frequently-bought-together'].includes(type as string) ||
            !Number.isSafeInteger(limit) || limit < 1 || limit > 10
        ) {
            return NextResponse.json({ error: 'Parâmetros de recomendação inválidos.' }, { status: 400 });
        }

        let products: any[] = [];

        switch (type) {
            case 'upsell':
                products = await getUpsellProducts(category, tags, limit);
                break;
            case 'cross-sell':
                products = await getCrossSellProducts(category, tags, cartItems, limit);
                break;
            case 'related':
                products = await getRelatedProducts(category, tags, productId, limit);
                break;
            case 'frequently-bought-together':
                products = await getFrequentlyBoughtTogether(productId, limit);
                break;
            default:
                products = await getRelatedProducts(category, tags, productId, limit);
        }

        return NextResponse.json({ products: products.map(toRecommendationProduct) });
    } catch (error) {
        console.error('Erro na API de recomendações:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// Produtos premium da mesma categoria (upsell)
async function getUpsellProducts(category: string, tags: string[], limit: number) {
    const { data, error } = await supabase
        .from('produtos')
        .select(RECOMMENDATION_FIELDS)
        .eq('categoria', category)
        .eq('em_estoque', true) // Correção do schema
        .order('preco', { ascending: false })
        .limit(limit * 2);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const prices = data.map(p => p.preco);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return data
        .filter(product => product.preco > avgPrice)
        .slice(0, limit);
}

// Produtos complementares baseados em tags e carrinho
async function getCrossSellProducts(category: string, tags: string[], cartItems: string[], limit: number) {
    const relatedTags = getRelatedTags(tags).slice(0, 8);
    const categoryQuery = category
        ? supabase
            .from('produtos')
            .select(RECOMMENDATION_FIELDS)
            .eq('em_estoque', true)
            .eq('categoria', category)
            .order('total_vendas', { ascending: false })
            .limit(limit * 3)
        : Promise.resolve({ data: [], error: null });

    const tagQueries = relatedTags.map((tag) =>
        supabase
            .from('produtos')
            .select(RECOMMENDATION_FIELDS)
            .eq('em_estoque', true)
            .contains('tags', [tag])
            .order('total_vendas', { ascending: false })
            .limit(limit * 3)
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

    return Array.from(uniqueProducts.values())
        .sort((a, b) => (b.total_vendas || 0) - (a.total_vendas || 0))
        .slice(0, limit);
}

// Produtos relacionados (mesma categoria e tags similares)
async function getRelatedProducts(category: string, tags: string[], excludeId: string, limit: number) {
    const { data, error } = await supabase
        .from('produtos')
        .select(RECOMMENDATION_FIELDS)
        .eq('categoria', category)
        .eq('em_estoque', true) // Correção do schema
        .neq('id', excludeId)
        .order('total_vendas', { ascending: false })
        .limit(limit * 2);

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

// Produtos frequentemente comprados juntos
async function getFrequentlyBoughtTogether(productId: string, limit: number) {
    const adminClient = createSupabaseAdminClient();
    const { data: orders, error: ordersError } = await adminClient
        .from('pedidos')
        .select('itens')
        .contains('itens', [{ produto_id: productId }])
        .limit(1000);

    if (ordersError) throw ordersError;

    const productFrequency: { [key: string]: number } = {};

    if (orders) {
        orders.forEach(order => {
            if (!Array.isArray(order.itens)) return;
            order.itens.forEach((item: any) => {
                const relatedId = String(item.produto_id);
                if (relatedId !== productId && /^\d{1,16}$/.test(relatedId)) {
                    productFrequency[relatedId] = (productFrequency[relatedId] || 0) + 1;
                }
            });
        });
    }

    const frequentProductIds = Object.entries(productFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([id]) => Number(id));

    if (frequentProductIds.length === 0) {
        const { data: product } = await supabase
            .from('produtos')
            .select('categoria')
            .eq('id', productId)
            .single();

        if (product) {
            return getRelatedProducts(product.categoria, [], productId, limit);
        }
        return [];
    }

    const { data, error } = await supabase
        .from('produtos')
        .select(RECOMMENDATION_FIELDS)
        .in('id', frequentProductIds)
        .eq('em_estoque', true); // Correção do schema

    if (error) throw error;

    return (data || []).sort((a, b) =>
        (productFrequency[b.id] || 0) - (productFrequency[a.id] || 0)
    );
}

function toRecommendationProduct(product: RecommendationRecord) {
    const media = Array.isArray(product.media_urls) ? product.media_urls : product.imagens;
    const image = Array.isArray(media)
        ? media.find((url: unknown) => typeof url === 'string' && url.length > 0) || ''
        : '';
    const hasPromo = typeof product.preco_promocional === 'number' &&
        product.preco_promocional > 0 &&
        product.preco_promocional < product.preco;

    return {
        id: String(product.id),
        nome: product.nome,
        preco: hasPromo ? product.preco_promocional : product.preco,
        preco_original: hasPromo ? product.preco : undefined,
        imagem_principal: image,
        categoria: product.categoria || '',
        tags: Array.isArray(product.tags) ? product.tags : [],
        total_vendas: product.total_vendas || 0,
    };
}

function calculateRelevanceScore(productTags: string[], userTags: string[]): number {
    if (!productTags || !userTags) return 0;
    const sharedTags = productTags.filter(tag => userTags.includes(tag));
    return sharedTags.length;
}

function getRelatedTags(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];
    
    const tagRelations: { [key: string]: string[] } = {
        'vestido': ['blusa', 'saia', 'acessorio', 'bolsa'],
        'blusa': ['vestido', 'calca', 'saia', 'acessorio'],
        'calca': ['blusa', 'camisa', 'tenis', 'acessorio'],
        'tenis': ['calca', 'short', 'camisa', 'acessorio'],
        'acessorio': ['bolsa', 'joia', 'oculos', 'cinto'],
        'bolsa': ['acessorio', 'vestido', 'blusa', 'joia']
    };

    const relatedTags = new Set<string>();

    tags.forEach(tag => {
        relatedTags.add(tag);
        const relations = tagRelations[tag.toLowerCase()] || [];
        relations.forEach(relatedTag => relatedTags.add(relatedTag));
    });

    return Array.from(relatedTags);
}