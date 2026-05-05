import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductPageContent from '@/components/ProductPageContent';
import { BreadcrumbSchema, ProductSchema } from '@/components/SEO/StructuredData';
import { notFound } from 'next/navigation';

const BUCKET_URL = "https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public/gringa-style-produtos/";
const SITE_URL = "https://gringa-style.netlify.app";

const resolveAbsoluteUrl = (path: string) => {
    if (!path) return `${SITE_URL}/imagens/logo_gringa_style.png`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${SITE_URL}${path}`;
    return `${BUCKET_URL}${path}`;
};

interface Props {
    params: Promise<{ id: string }>;
}

export const revalidate = 60; // Cache de 60 segundos para performance (ISR)

export async function generateStaticParams() {
    const { data: products } = await supabase
        .from('produtos')
        .select('slug, id')
        .limit(50);

    return products?.map((product) => ({
        // Gera o cache estático usando o slug moderno. Se não tiver, usa o ID como fallback.
        id: product.slug || String(product.id),
    })) || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id: slug } = await params; // Aguarda a Promise do Next.js 15+

    // 1. Estratégia Principal: Busca pelo Slug Imutável (SEO Perfeito)
    let { data: product } = await supabase
        .from('produtos')
        .select('nome, descricao, imagens, media_urls, slug, preco, preco_promocional, em_estoque')
        .eq('slug', slug)
        .maybeSingle();

    // 2. Fallback de Segurança: Se não achou pelo slug, extrai o ID antigo para não quebrar links passados
    if (!product) {
        const idMatch = slug.match(/^(\d+)/);
        if (idMatch) {
            const { data: legacyProduct } = await supabase
                .from('produtos')
                .select('nome, descricao, imagens, media_urls, slug, preco, preco_promocional, em_estoque')
                .eq('id', parseInt(idMatch[1], 10))
                .maybeSingle();
            product = legacyProduct;
        }
    }

    if (!product) {
        return {
            title: 'Produto não encontrado | Gringa Style',
            description: 'O produto que você procura não foi encontrado.'
        };
    }

    const mediaUrls = product.media_urls || product.imagens || [];
    const imageUrl = resolveAbsoluteUrl(mediaUrls.find((url: string) => !url.includes('.mp4') && !url.includes('.webm')));
    const descricaoLimpa = product.descricao?.substring(0, 160).replace(/<[^>]*>?/gm, '') || `Compre ${product.nome} na Gringa Style - Equipamentos de solda de qualidade.`;

    const productUrl = `https://gringa-style.netlify.app/produto/${product.slug || slug}`;
    const precoFinal = product.preco_promocional || product.preco;

    return {
        title: `${product.nome} | Gringa Style`,
        description: descricaoLimpa,
        keywords: [product.nome, 'gringa style', 'solda', 'tig', 'máscara de solda'],
        alternates: {
            // URL Canônica absoluta para evitar duplicação de URL
            canonical: productUrl,
        },
        openGraph: {
            title: product.nome,
            description: descricaoLimpa,
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
            title: product.nome,
            description: descricaoLimpa,
            images: [imageUrl],
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const { id: slug } = await params;

    // Fetch do produto completo validando pelo slug
    let { data: product } = await supabase
        .from('produtos')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    // Fallback para renderizar o produto caso seja um link antigo com ID
    if (!product) {
        const idMatch = slug.match(/^(\d+)/);
        if (idMatch) {
            const { data: legacyProduct } = await supabase
                .from('produtos')
                .select('*')
                .eq('id', parseInt(idMatch[1], 10))
                .maybeSingle();
            product = legacyProduct;
        }
    }

    if (!product) {
        notFound();
    }

    const productUrl = `https://gringa-style.netlify.app/produto/${product.slug || product.id}`;

    return (
        <>
            <BreadcrumbSchema items={[
                { name: 'Gringa Style', url: '/' },
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
                tags: product.tags
            }} />
            {/* Mantive a sua prop id=productId para não quebrar o Client Component */}
            <ProductPageContent id={product.id} initialProduct={product} />
        </>
    );
}


