import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductPageContent from '@/components/ProductPageContent';
import StickyCTA from '@/components/StickyCTA';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const productId = parseInt(id.split('-')[0]);

    const { data: product, error } = await supabase
        .from('produtos')
        .select('nome, descricao, imagens, media_urls')
        .eq('id', productId)
        .single();

    console.log('Metadata fetch for ID:', productId, 'Result:', product, 'Error:', error);

    if (!product) {
        return {
            title: 'Produto não encontrado | Gringa Style',
            description: 'O produto que você procura não foi encontrado.'
        };
    }

    const mediaUrls = product.media_urls || product.imagens || [];
    const imageUrl = mediaUrls.find((url: string) => !url.includes('.mp4') && !url.includes('.webm')) || '/imagens/gringa_style_logo.png';

    return {
        title: `${product.nome} | Gringa Style`,
        description: product.descricao || `Compre ${product.nome} na Gringa Style.`,
        openGraph: {
            title: product.nome,
            description: product.descricao || `Compre ${product.nome} na Gringa Style.`,
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 600,
                    alt: product.nome,
                },
            ],
        },
    };
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
    const { data: products } = await supabase
        .from('produtos')
        .select('id')
        .limit(50); // Pre-render top 50 products

    return products?.map((product) => ({
        id: String(product.id),
    })) || [];
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    const productId = parseInt(id.split('-')[0]);

    const { data: product } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', productId)
        .single();

    const jsonLd = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.nome,
        image: product.media_urls?.[0] || product.imagens?.[0],
        description: product.descricao,
        sku: String(product.id),
        offers: {
            '@type': 'Offer',
            url: `https://gringastyle.com.br/produto/${product.id}`,
            priceCurrency: 'BRL',
            price: product.preco_promocional || product.preco,
            availability: product.em_estoque ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductPageContent id={productId} />
            {product && <StickyCTA product={product} />}
        </>
    );
}
