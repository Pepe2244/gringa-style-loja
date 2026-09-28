import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import CategoryPageContent from '@/components/home/CategoryPageContent';
import { notFound } from 'next/navigation';

export const revalidate = 60;

interface Props {
    params: Promise<{ id: string }>;
}

const SEO_CONTENT: Record<string, { intro: string; title: string; description: string }> = {
    default: {
        title: 'Categoria | Gringa Style',
        description: 'Produtos para soldadores profissionais.',
        intro: 'Produtos selecionados para profissionais de soldagem.',
    },
};

export async function generateStaticParams() {
    const { data: categories } = await supabase
        .from('categorias')
        .select('id')
        .order('nome');

    return categories?.map((cat) => ({ id: String(cat.id) })) || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    const { data: category } = await supabase
        .from('categorias')
        .select('nome')
        .eq('id', categoryId)
        .maybeSingle();

    if (!category) {
        return {
            title: 'Categoria não encontrada | Gringa Style',
            description: 'A categoria que você procura não foi encontrada.',
        };
    }

    const categoryName = category.nome;
    const title = `${categoryName} | Compre Online | Gringa Style`;
    const description = `${categoryName} para soldadores profissionais: máscaras, EPIs e acessórios para soldagem TIG/MIG. Pronta entrega para todo o Brasil, PIX e até 12x sem juros.`;
    const canonicalUrl = `https://gringastylebr.com.br/categoria/${id}`;

    return {
        title,
        description,
        keywords: [categoryName, 'máscara de solda', 'epi soldador', 'solda tig', 'gringa style', 'acessórios solda'],
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'Gringa Style',
            locale: 'pt_BR',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default async function CategoriaPage({ params }: Props) {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    const [categoryResult, productsResult] = await Promise.all([
        supabase.from('categorias').select('*').eq('id', categoryId).maybeSingle(),
        supabase
            .from('produtos')
            .select('id, nome, preco, preco_promocional, preco_pix, imagens, media_urls, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, produtos_relacionados_ids')
            .eq('categoria_id', categoryId)
            .order('created_at', { ascending: false }),
    ]);

    const category = categoryResult.data as Category | null;
    if (!category) notFound();

    const products = (productsResult.data || []) as Product[];

    return <CategoryPageContent category={category} products={products} />;
}
