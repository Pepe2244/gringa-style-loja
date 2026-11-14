import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductPageContent from '@/components/ProductPageContent';
import { BreadcrumbSchema, ProductSchema } from '@/components/SEO/StructuredData';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildCanonicalUrl } from '@/lib/site-config';
import { resolveAbsoluteUrl, fetchProductBySlugOrId, getCachedCategories, getCachedRelatedProducts } from '@/lib/product-service';
import { getCanonicalProductSlug } from '@/utils/slugify';

function getProductMediaUrls(product: any): string[] {
    const raw = (Array.isArray(product?.media_urls) && product.media_urls.length > 0)
        ? product.media_urls
        : (Array.isArray(product?.imagens) ? product.imagens : []);
    return raw.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0);
}

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

export const revalidate = 3600; // Cache ISR estático de alto desempenho na borda (Cloudflare CDN)
export const dynamicParams = true; // Garante que novos produtos criados no painel sejam gerados sob demanda

export async function generateStaticParams() {
    const { data: products } = await supabase
        .from('produtos')
        .select('slug, id, nome')
        .limit(100);

    return products?.map((product) => ({
        id: getCanonicalProductSlug(product),
    })) || [];
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

    const canonicalSlug = getCanonicalProductSlug(product);
    const productUrl = buildCanonicalUrl(`/produto/${canonicalSlug}`);

    const mediaUrls = getProductMediaUrls(product);
    const imageUrl = resolveAbsoluteUrl(mediaUrls.find((url) => !url.includes('.mp4') && !url.includes('.webm')));

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
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        other: {
            'product:price:amount': precoFinal ? precoFinal.toFixed(2) : '',
            'product:price:currency': 'BRL',
            'product:availability': product.em_estoque ? 'in stock' : 'out of stock',
            'product:brand': product.marca || 'Gringa Style',
            'product:condition': 'new',
            'og:price:amount': precoFinal ? precoFinal.toFixed(2) : '',
            'og:price:currency': 'BRL',
            'pinterest-rich-pin': 'true',
        },
    };
}

const CATEGORY_NAMES: Record<number, string> = {
    4: 'Camisas',
    5: 'Bonés',
    6: 'Máscaras',
    7: 'Acessórios',
    8: 'Kits',
    9: 'Lentes',
};

export default async function ProductPage({ params }: Props) {
    const { id: slug } = await params;
    const product = await fetchProductBySlugOrId(slug);

    if (!product) {
        notFound();
    }

    const canonicalSlug = getCanonicalProductSlug(product);

    // REGRA DE OURO SEO: Se acessou por ID ou URL legada mas existe um slug canônico limpo, força 308/301 automático
    if (canonicalSlug && slug !== canonicalSlug) {
        permanentRedirect(`/produto/${canonicalSlug}`);
    }

    const productUrl = buildCanonicalUrl(`/produto/${canonicalSlug}`);
    
    // Executa categorias e produtos relacionados em paralelo com cache distribuído para TTFB ultrarrápido (< 100ms)
    const [categories, initialRelatedProducts] = await Promise.all([
        getCachedCategories(),
        getCachedRelatedProducts(product)
    ]);
    const dynamicCategory = product.categoria_id ? categories.find((c: any) => c.id === product.categoria_id) : null;
    const categoryName = dynamicCategory?.nome || (product.categoria_id ? CATEGORY_NAMES[product.categoria_id] : null);

    const mediaUrls = getProductMediaUrls(product);
    const mainImageUrl = resolveAbsoluteUrl(mediaUrls.find((url) => !url.includes('.mp4') && !url.includes('.webm')));

    return (
        <>
            {mainImageUrl && (
                <link
                    rel="preload"
                    as="image"
                    href={mainImageUrl}
                    fetchPriority="high"
                />
            )}
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
                slug: canonicalSlug,
                em_estoque: product.em_estoque,
                imagens: product.imagens,
                media_urls: product.media_urls,
                variants: product.variants,
                tags: product.tags,
                marca: product.marca || 'Gringa Style',
                avaliacoes: product.avaliacoes,
                totalAvaliacoes: product.total_avaliacoes || product.totalAvaliacoes,
                gtin13: product.gtin13 || product.codigo_barras,
                created_at: product.created_at,
                updated_at: product.updated_at,
            }} />
            <ProductPageContent
                id={product.id}
                initialProduct={product}
                initialRelatedProducts={initialRelatedProducts}
            />
        </>
    );
}
