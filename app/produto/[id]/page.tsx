import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductPageContent from '@/components/ProductPageContent';
import { BreadcrumbSchema, ProductSchema } from '@/components/SEO/StructuredData';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildCanonicalUrl, buildStorageUrl, siteConfig } from '@/lib/site-config';

const resolveAbsoluteUrl = (path?: string | null) => {
    if (!path) return `${siteConfig.appUrl}/imagens/logo_gringa_style.png`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${siteConfig.appUrl}${path}`;
    return buildStorageUrl(path);
};

// Formata o título dinamicamente para não estourar os 60 caracteres da SERP do Google
function formatSEOTitle(nome: string, precoFormatado: string, emEstoque: boolean): string {
    const estoqueBadge = emEstoque ? 'Pronta Entrega' : 'Sob Encomenda';
    
    // Simplifica separadores longos como "---" ou títulos com subtítulos excessivos
    const nomeLimpo = nome.split('---')[0].trim();
    
    const candidateWithPrice = `${nomeLimpo} - R$ ${precoFormatado} | Gringa Style`;
    if (candidateWithPrice.length <= 60) {
        return candidateWithPrice;
    }

    const candidateWithBadge = `${nomeLimpo} | ${estoqueBadge} | Gringa Style`;
    if (candidateWithBadge.length <= 60) {
        return candidateWithBadge;
    }

    if (`${nomeLimpo} | Gringa Style`.length <= 60) {
        return `${nomeLimpo} | Gringa Style`;
    }

    return `${nomeLimpo.substring(0, 45)}... | Gringa Style`;
}

interface Props {
    params: Promise<{ id: string }>;
}

export const revalidate = 60; // Cache ISR

export async function generateStaticParams() {
    const { data: products } = await supabase
        .from('produtos')
        .select('slug, id')
        .limit(100);

    return products?.map((product) => ({
        id: product.slug || String(product.id),
    })) || [];
}

// Cache em memória compartilhado para evitar queries repetidas ao banco durante o ciclo de renderização
let allProductsCache: any[] | null = null;
let allProductsCacheTime = 0;

async function getAllActiveProducts() {
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
function normalizeSlugCompare(str: string): string {
    return (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fetchProductBySlugOrId(rawSlugOrId: string) {
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
    // Compara o slug solicitado contra:
    // a) O slug no banco normalizado
    // b) O slugify do nome do produto no banco (com acentos convertidos corretamente)
    // c) O slug legado do banco sem acentos
    const targetNorm = normalizeSlugCompare(decoded);
    if (targetNorm) {
        const allProducts = await getAllActiveProducts();
        const found = allProducts.find((p: any) => {
            if (!p) return false;
            if (p.slug && normalizeSlugCompare(p.slug) === targetNorm) return true;
            if (p.nome && normalizeSlugCompare(p.nome) === targetNorm) return true;
            // Compatibilidade com slugs antigos onde as letras acentuadas foram apagadas (ex: "mscara")
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

        // 5. Fallback por similaridade de tokens principais (para URLs históricas truncadas pelo Googlebot)
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id: slug } = await params;
    const product = await fetchProductBySlugOrId(slug);

    if (!product) {
        return {
            title: { absolute: 'Produto não encontrado | Gringa Style' },
            description: 'O produto que você procura não foi encontrado ou está esgotado.'
        };
    }

    const canonicalSlug = product.slug || slug;
    const productUrl = buildCanonicalUrl(`/produto/${canonicalSlug}`);

    const mediaUrls = product.media_urls || product.imagens || [];
    const imageUrl = resolveAbsoluteUrl(mediaUrls.find((url: string) => !url.includes('.mp4') && !url.includes('.webm')));

    const precoFinal = product.preco_promocional || product.preco;
    const precoFormatado = precoFinal ? precoFinal.toFixed(2).replace('.', ',') : '';
    const estoqueTexto = product.em_estoque ? 'Pronta entrega' : 'Sob encomenda';

    const title = formatSEOTitle(product.nome, precoFormatado, product.em_estoque);

    // Limpa tags HTML e resumos quebrados
    const descricaoLimpa = product.descricao?.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() || '';
    
    // Descrição orientada a conversão (CTR) para os snippets do Google
    const description = `Compre ${product.nome}${precoFormatado ? ` por R$ ${precoFormatado}` : ''}. ${estoqueTexto} com envio rápido, PIX com desconto e até 12x no cartão. ${descricaoLimpa}`.substring(0, 155);

    return {
        title: {
            absolute: title,
        },
        description,
        keywords: [
            product.nome,
            'máscara de solda personalizada',
            'fibra de vidro',
            'solda tig',
            'solda mig',
            'equipamento de soldador',
            'botina de segurança',
            'streetwear soldador',
            'gringa style'
        ],
        alternates: {
            canonical: productUrl,
        },
        openGraph: {
            title,
            description,
            url: productUrl,
            type: 'website',
            siteName: 'Gringa Style',
            locale: 'pt_BR',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: product.nome,
                    type: 'image/jpeg',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

const CATEGORY_NAMES: Record<number, string> = {
    4: 'Camisas',
    5: 'Bonés',
    6: 'Máscaras',
    7: 'Acessórios',
    8: 'Kits',
};

export default async function ProductPage({ params }: Props) {
    const { id: slug } = await params;
    const product = await fetchProductBySlugOrId(slug);

    if (!product) {
        notFound();
    }

    // REGRA DE OURO SEO: Se acessou por ID ou URL legada mas existe um slug limpo, força 301 automático
    if (product.slug && slug !== product.slug) {
        permanentRedirect(`/produto/${product.slug}`);
    }

    const productUrl = buildCanonicalUrl(`/produto/${product.slug || product.id}`);
    const categoryName = product.categoria_id ? CATEGORY_NAMES[product.categoria_id] : null;

    return (
        <>
            <BreadcrumbSchema items={[
                { name: 'Início', url: '/' },
                { name: 'Loja', url: '/loja' },
                ...(product.categoria_id && categoryName ? [
                    { name: categoryName, url: `/categoria/${product.categoria_id}` }
                ] : []),
                { name: product.nome, url: productUrl }
            ]} />
            <ProductSchema product={{
                id: product.id,
                nome: product.nome,
                descricao: product.descricao,
                preco: product.preco,
                preco_promocional: product.preco_promocional,
                slug: product.slug,
                em_estoque: product.em_estoque,
                imagens: product.imagens,
                media_urls: product.media_urls,
                variants: product.variants,
                tags: product.tags,
                marca: 'Gringa Style'
            }} />
            <ProductPageContent id={product.id} initialProduct={product} />
        </>
    );
}
