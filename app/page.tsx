import { supabase } from '@/lib/supabase';
import HomeContent from '@/components/home/HomeContent';
import { Product } from '@/types';
import { WebPageSchema } from '@/components/SEO/StructuredData';
import type { Metadata } from 'next';
import { getCachedValue } from '@/lib/cache';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG',
  description: 'Encontre as melhores máscaras de solda personalizadas, automáticas e acessórios para TIG. Estilo e proteção para soldadores profissionais. Confira!',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Gringa Style | Máscaras de Solda Personalizadas',
    description: 'Estilo e proteção para soldadores profissionais.',
    url: 'https://www.gringastylebr.com.br',
    siteName: 'Gringa Style',
    images: [{ url: '/imagens/logo_gringa_style.png', width: 800, height: 600 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gringa Style',
    description: 'Máscaras de solda personalizadas e acessórios para TIG.',
    images: ['/imagens/logo_gringa_style.png'],
  },
};

export default async function Home() {
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
      ['home-products-list'],
      ['produtos', 'home'],
      30
    ),
    getCachedValue(
      async () => {
        const { data } = await supabase.from('categorias').select('*').order('nome');
        return data || [];
      },
      ['home-categories-list'],
      ['categorias', 'home'],
      60
    ),
    getCachedValue(
      async () => {
        const { data } = await supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle();
        return data ? parseInt(data.valor) : 7;
      },
      ['home-config-dias-novo'],
      ['configuracoes', 'home'],
      60
    )
  ]);

  return (
    <main>
      <WebPageSchema page={{
        name: 'Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG',
        description: 'Encontre as melhores máscaras de solda personalizadas, automáticas e acessórios para TIG. Estilo e proteção para soldadores profissionais. Confira!',
        url: '/'
      }} />
      <HomeContent
        initialProducts={products}
        categories={categories}
        diasNovo={diasNovo}
      />
    </main>
  );
}