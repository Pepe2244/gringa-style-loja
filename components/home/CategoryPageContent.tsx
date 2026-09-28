'use client';

import { Product, Category } from '@/types';
import ProductGrid from '@/components/home/ProductGrid';
import Breadcrumbs from '@/components/Breadcrumbs';
import { CollectionPageSchema, BreadcrumbSchema } from '@/components/SEO/StructuredData';

interface CategoryPageContentProps {
    category: Category;
    products: Product[];
}

export default function CategoryPageContent({ category, products }: CategoryPageContentProps) {
    const categoryName = category.nome;
    const canonicalUrl = `https://gringastylebr.com.br/categoria/${category.id}`;

    const introText = getCategoryIntro(categoryName);

    return (
        <>
            <CollectionPageSchema page={{
                name: `${categoryName} | Gringa Style`,
                description: introText,
                url: canonicalUrl,
                products: products.map(p => ({
                    id: p.id,
                    nome: p.nome,
                    preco: p.preco,
                    preco_promocional: p.preco_promocional,
                    em_estoque: p.em_estoque,
                    imagens: p.imagens,
                    media_urls: p.media_urls,
                    slug: p.slug,
                })),
            }} />
            <BreadcrumbSchema items={[
                { name: 'Gringa Style', url: '/' },
                { name: 'Loja', url: '/loja' },
                { name: categoryName, url: canonicalUrl },
            ]} />

            <div className="container" style={{ padding: '20px 15px 60px' }}>
                <Breadcrumbs items={[
                    { label: 'Início', href: '/' },
                    { label: 'Loja', href: '/loja' },
                    { label: categoryName },
                ]} />

                <div style={{ marginTop: '24px', marginBottom: '40px' }}>
                    <h1 className="titulo-secao" style={{ marginBottom: '12px' }}>{categoryName}</h1>
                    <p style={{ color: '#ccc', fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '800px' }}>
                        {introText}
                    </p>
                </div>

                <ProductGrid
                    products={products}
                    loading={false}
                    diasNovo={7}
                    onQuickView={() => {}}
                    hasMore={false}
                    loadingMore={false}
                    onLoadMore={() => {}}
                />

                <section style={{ marginTop: '60px', padding: '40px', backgroundColor: 'rgba(17,17,17,0.7)', borderRadius: '10px', border: '1px solid #333' }}>
                    <h2 className="titulo-seco" style={{ fontSize: '1.8rem', marginBottom: '16px', color: 'var(--cor-destaque)', fontFamily: 'var(--fonte-titulos)' }}>
                        Sobre {categoryName}
                    </h2>
                    <div style={{ color: '#bbb', lineHeight: '1.8', fontSize: '1rem' }}>
                        {getCategoryAboutText(categoryName)}
                    </div>
                </section>
            </div>
        </>
    );
}

function getCategoryIntro(categoryName: string): string {
    const name = categoryName.toLowerCase();

    if (name.includes('máscara') || name.includes('mascara')) {
        return 'Máscaras de solda personalizadas em fibra de vidro com proteção UV/IR para soldagem TIG e MIG. Lentes passivas escuras com visibilidade cristalina da poça de fusão, design exclusivo e pronta entrega para todo o Brasil.';
    }
    if (name.includes('vestu') || name.includes('camiseta') || name.includes('boné') || name.includes('bone')) {
        return 'Vestuário e acessórios para soldadores: bonés aba curva estruturados, camisetas estampadas e itens de streetwear industrial. Conforto, estilo e durabilidade para o profissional que orgulha a profissão.';
    }
    if (name.includes('epi') || name.includes('proteção') || name.includes('protecao')) {
        return 'EPIs para soldadores: luvas, botinas com bico de composite/aço, mangotes e acessórios de proteção para soldagem TIG/MIG. Segurança certificada com conforto para uso prolongado.';
    }
    if (name.includes('tocha') || name.includes('acessóri') || name.includes('acessori')) {
        return 'Tochas, bocais e acessórios de alta precisão para soldagem TIG/MIG. Peças de reposição e equipamentos para quem busca o melhor acabamento e performance no cordão de solda.';
    }

    return `${categoryName} para soldadores profissionais: equipamentos de alta performance para soldagem TIG/MIG com qualidade, estilo e pronta entrega para todo o Brasil.`;
}

function getCategoryAboutText(categoryName: string): string {
    const name = categoryName.toLowerCase();

    if (name.includes('máscara') || name.includes('mascara')) {
        return 'Nossas máscaras de solda são fabricadas em fibra de vidro leve e resistente, oferecendo proteção contra raios UV e infravermelhos gerados pelo arco elétrico. As lentes passivas escuras garantem visibilidade cristalina da poça de fusão, minimizando a fadiga ocular mesmo após horas de trabalho contínuo. Cada máscara pode ser personalizada com designs exclusivos, tornando-se uma extensão da identidade do soldador. Enviamos para todo o Brasil com pagamento via PIX (aprovação imediata) ou cartão de crédito em até 12x sem juros.';
    }
    if (name.includes('vestu') || name.includes('camiseta') || name.includes('boné') || name.includes('bone')) {
        return 'Linha de vestuário e acessórios desenvolvida para soldadores que não abrem mão do estilo. Bonés aba curva estruturados, camisetas em algodão estampadas e itens de streetwear industrial que combinam durabilidade e atitude. Peças pensadas para o dia a dia da oficina e para o orgulho da profissão. Pronta entrega e envio para todo o Brasil.';
    }
    if (name.includes('epi') || name.includes('proteção') || name.includes('protecao')) {
        return 'Equipamentos de Proteção Individual selecionados para a segurança do soldador. Luvas térmicas, botinas com bico de composite ou aço, mangotes e demais acessórios que garantem proteção contra calor, faíscas e impactos. Conforto para uso prolongado e certificação de segurança. Compre com PIX ou cartão em até 12x sem juros.';
    }
    if (name.includes('tocha') || name.includes('acessóri') || name.includes('acessori')) {
        return 'Tochas, bocais e acessórios de precisão para soldagem TIG e MIG. Peças de reposição originais e compatíveis, selecionadas para garantir o melhor desempenho e acabamento no cordão de solda. Produtos para quem exige performance e durabilidade no equipamento. Entrega rápida para todo o Brasil.';
    }

    return `Seleção de ${categoryName.toLowerCase()} para profissionais de soldagem. Produtos com qualidade garantida, envio para todo o Brasil e pagamento via PIX ou cartão de crédito em até 12x sem juros.`;
}
