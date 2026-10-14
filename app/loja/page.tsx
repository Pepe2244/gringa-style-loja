import type { Metadata } from 'next';
import HomeContent from '@/components/home/HomeContent';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { getCachedValue } from '@/lib/cache';
import { buildCanonicalUrl } from '@/lib/site-config';
import { BreadcrumbSchema, CollectionPageSchema } from '@/components/SEO/StructuredData';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Loja Gringa Style | Máscaras de Solda, EPIs e Acessórios TIG',
  description: 'Compre máscaras de solda personalizadas, EPIs, tochas e acessórios para soldagem TIG/MIG. Pronta entrega, PIX e até 12x sem juros para todo o Brasil.',
  alternates: { canonical: buildCanonicalUrl('/loja') },
  keywords: [
    'loja solda',
    'máscara de solda',
    'epi soldador',
    'acessórios tig',
    'tocha solda',
    'gringa style loja',
  ],
  openGraph: {
    title: 'Loja Gringa Style | Máscaras de Solda, EPIs e Acessórios TIG',
    description: 'Compre máscaras de solda personalizadas, EPIs, tochas e acessórios para soldagem TIG/MIG. Pronta entrega para todo o Brasil.',
    url: buildCanonicalUrl('/loja'),
    siteName: 'Gringa Style',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default async function LojaPage() {
  const [products, categories, diasNovo] = await Promise.all([
    getCachedValue(
      async () => {
        const { data } = await supabase
          .from('produtos')
          .select('id, nome, preco, preco_promocional, preco_pix, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
          .order('created_at', { ascending: false })
          .limit(12);
        return (data || []) as Product[];
      },
      ['loja-products-list'],
      ['produtos', 'loja'],
      30,
    ),
    getCachedValue(
      async () => {
        const { data } = await supabase.from('categorias').select('*').order('nome');
        return data || [];
      },
      ['loja-categories-list'],
      ['categorias', 'loja'],
      60,
    ),
    getCachedValue(
      async () => {
        const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle();
        return data ? parseInt(data.valor) : 7;
      },
      ['loja-config-dias-novo'],
      ['configuracoes', 'loja'],
      60,
    ),
  ]);

  const lojaUrl = buildCanonicalUrl('/loja');

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Início', url: '/' },
        { name: 'Loja', url: lojaUrl },
      ]} />
      <CollectionPageSchema page={{
        name: 'Loja Gringa Style',
        description: 'Catálogo de máscaras de solda personalizadas, EPIs e acessórios para soldagem TIG e MIG.',
        url: lojaUrl,
        products: products.map(p => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          preco: p.preco,
          preco_promocional: p.preco_promocional,
          em_estoque: p.em_estoque,
          imagens: p.imagens,
          media_urls: p.media_urls,
          slug: p.slug,
        })),
      }} />
      <HomeContent initialProducts={products} categories={categories} diasNovo={diasNovo} />
    </>
  );
}
