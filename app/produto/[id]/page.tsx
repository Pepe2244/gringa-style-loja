import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductPageContent from '@/components/ProductPageContent';
import { BreadcrumbSchema, ProductSchema } from '@/components/SEO/StructuredData';
import { notFound, permanentRedirect } from 'next/navigation';

const BUCKET_URL = "https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public/gringa-style-produtos/";
const SITE_URL = "https://gringastylebr.com.br";

const resolveAbsoluteUrl = (path?: string | null) => {
    if (!path) return `${SITE_URL}/imagens/logo_gringa_style.png`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${SITE_URL}${path}`;
    return `${BUCKET_URL}${path}`;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id: slug } = await params;

    // 1. Busca pelo Slug Oficial
    let { data: product } = await supabase
        .from('produtos')
        .select('nome, descricao, imagens, media_urls, slug, preco, preco_promocional, em_estoque')
        .eq('slug', slug)
        .maybeSingle();

    // 2. Fallback de Segurança para slugs antigos com ID
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
            description: 'O produto que você procura não foi encontrado ou está esgotado.'
        };
    }

    const canonicalSlug = product.slug || slug;
    const productUrl = `${SITE_URL}/produto/${canonicalSlug}`;

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
        title,
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

export default async function ProductPage({ params }: Props) {
    const { id: slug } = await params;

    // Busca do produto
    let { data: product } = await supabase
        .from('produtos')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    // Fallback caso acesse via ID legado
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

    // REGRA DE OURO SEO: Se acessou por ID ou URL legada mas existe um slug limpo, força 301 automático
    if (product.slug && slug !== product.slug) {
        permanentRedirect(`/produto/${product.slug}`);
    }

    const productUrl = `${SITE_URL}/produto/${product.slug || product.id}`;

    return (
        <>
            <BreadcrumbSchema items={[
                { name: 'Início', url: '/' },
                { name: 'Loja', url: '/loja' },
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
            <ProductPageContent id={product.id} initialProduct={product} />
        </>
    );
}
