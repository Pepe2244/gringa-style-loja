import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import CategoryPageContent from '@/components/home/CategoryPageContent';
import { notFound } from 'next/navigation';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';
import { BreadcrumbSchema, CollectionPageSchema, ItemListSchema } from '@/components/SEO/StructuredData';
import { resolveAbsoluteUrl } from '@/lib/product-service';

export const revalidate = 60;

interface Props {
    params: Promise<{ id: string }>;
}

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

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
        return {
            title: 'Categoria não encontrada | Gringa Style',
            description: 'Categoria de produtos não encontrada.',
        };
    }

    const [categoryRes, sampleProductRes] = await Promise.all([
        supabase
            .from('categorias')
            .select('nome')
            .eq('id', categoryId)
            .maybeSingle(),
        supabase
            .from('produtos')
            .select('imagens, media_urls')
            .eq('categoria_id', categoryId)
            .limit(1)
            .maybeSingle(),
    ]);

    const category = categoryRes.data;

    if (!category) {
        return {
            title: { absolute: 'Categoria não encontrada | Gringa Style' },
            description: 'A categoria que você procura não foi encontrada.',
        };
    }

    const categoryName = category.nome;
    const rawTitle = `${categoryName} | Compre Online | Gringa Style`;
    const title = rawTitle.length <= 60 ? rawTitle : `${categoryName} | Gringa Style`;
    const description = `${categoryName} para soldadores profissionais: máscaras, EPIs e acessórios para soldagem TIG/MIG. Pronta entrega para todo o Brasil, PIX e até 12x sem juros.`;
    const canonicalUrl = buildCanonicalUrl(`/categoria/${id}`);

    const sampleMedia = sampleProductRes.data?.media_urls || sampleProductRes.data?.imagens || [];
    const firstImageUrl = sampleMedia.find((u: string) => !u.includes('.mp4') && !u.includes('.webm'));
    const categoryOgImage = firstImageUrl ? resolveAbsoluteUrl(firstImageUrl) : `${siteConfig.appUrl}/imagens/logo_gringa_style.png`;

    return {
        title: { absolute: title },
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
            images: [
                {
                    url: categoryOgImage,
                    width: 1200,
                    height: 630,
                    alt: categoryName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [categoryOgImage],
        },
    };
}

export default async function CategoriaPage({ params }: Props) {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
        notFound();
    }

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

    let products = (productsResult.data || []) as Product[];

    // Se a categoria ainda não tiver produtos diretos vinculados, carrega vitrine de destaque para evitar ItemList vazio
    if (products.length === 0) {
        const { data: fallbackData } = await supabase
            .from('produtos')
            .select('id, nome, preco, preco_promocional, preco_pix, imagens, media_urls, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, produtos_relacionados_ids')
            .eq('em_estoque', true)
            .order('created_at', { ascending: false })
            .limit(8);
        products = (fallbackData || []) as Product[];
    }

    const canonicalUrl = buildCanonicalUrl(`/categoria/${id}`);
    const schemaProducts = products.map((p) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        preco: p.preco,
        preco_promocional: p.preco_promocional,
        em_estoque: p.em_estoque,
        imagens: p.imagens,
        media_urls: p.media_urls,
        slug: p.slug,
    }));

    return (
        <>
            <BreadcrumbSchema items={[
                { name: 'Início', url: '/' },
                { name: 'Loja', url: '/loja' },
                { name: category.nome, url: canonicalUrl },
            ]} />
            <ItemListSchema
                products={schemaProducts}
                pageUrl={canonicalUrl}
            />
            <CollectionPageSchema page={{
                name: `${category.nome} | Gringa Style`,
                description: `${category.nome} para soldadores profissionais na Gringa Style.`,
                url: canonicalUrl,
                products: schemaProducts,
            }} />
            <CategoryPageContent category={category} products={products} />
        </>
    );
}
