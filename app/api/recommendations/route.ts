import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RecommendationRequest {
    productId: string;
    category: string;
    tags: string[];
    cartItems: string[];
    userHistory: string[];
    type: 'upsell' | 'cross-sell' | 'related' | 'frequently-bought-together';
    limit: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: RecommendationRequest = await request.json();
        const { productId, category, tags, cartItems, userHistory, type, limit = 4 } = body;

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

        return NextResponse.json({ products });
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
        .select('*')
        .eq('categoria', category)
        .eq('ativo', true)
        .order('preco', { ascending: false })
        .limit(limit * 2); // Buscar mais para filtrar

    if (error) throw error;

    const prices = data.map(p => p.preco);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    return data
        .filter(product => product.preco > avgPrice)
        .slice(0, limit);
}

// Produtos complementares baseados em tags e carrinho
async function getCrossSellProducts(category: string, tags: string[], cartItems: string[], limit: number) {
    // Buscar produtos com tags relacionadas
    const relatedTags = getRelatedTags(tags);

    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .or(`categoria.eq.${category},tags.cs.{${relatedTags.join(',')}}`)
        .not('id', 'in', `(${cartItems.join(',')})`)
        .order('total_vendas', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return data;
}

// Produtos relacionados (mesma categoria e tags similares)
async function getRelatedProducts(category: string, tags: string[], excludeId: string, limit: number) {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('categoria', category)
        .eq('ativo', true)
        .neq('id', excludeId)
        .order('total_vendas', { ascending: false })
        .limit(limit * 2);

    if (error) throw error;

    // Priorizar produtos com tags em comum
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
    // Buscar pedidos que contenham este produto
    const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('itens')
        .contains('itens', [{ produto_id: productId }]);

    if (ordersError) throw ordersError;

    // Contar frequência de produtos comprados juntos
    const productFrequency: { [key: string]: number } = {};

    orders.forEach(order => {
        order.itens.forEach((item: any) => {
            if (item.produto_id !== productId) {
                productFrequency[item.produto_id] = (productFrequency[item.produto_id] || 0) + 1;
            }
        });
    });

    // Buscar os produtos mais frequentes
    const frequentProductIds = Object.entries(productFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

    if (frequentProductIds.length === 0) {
        // Fallback para produtos da mesma categoria
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
        .select('*')
        .in('id', frequentProductIds)
        .eq('ativo', true);

    if (error) throw error;

    // Ordenar pela frequência
    return data.sort((a, b) =>
        (productFrequency[b.id] || 0) - (productFrequency[a.id] || 0)
    );
}

// Calcular score de relevância baseado em tags compartilhadas
function calculateRelevanceScore(productTags: string[], userTags: string[]): number {
    const sharedTags = productTags.filter(tag => userTags.includes(tag));
    return sharedTags.length;
}

// Obter tags relacionadas (expansão de tags)
function getRelatedTags(tags: string[]): string[] {
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