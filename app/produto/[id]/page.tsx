import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductPageContent from '@/components/ProductPageContent';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const productId = parseInt(id);

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

export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    return <ProductPageContent id={parseInt(id)} />;
}
