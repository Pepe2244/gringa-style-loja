import { supabase } from '@/lib/supabase';
import HomeContent from '@/components/home/HomeContent';
import { Product } from '@/types';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG',
  description: 'Encontre as melhores máscaras de solda personalizadas, automáticas e acessórios para TIG. Estilo e proteção para soldadores profissionais. Confira!',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Gringa Style | Máscaras de Solda Personalizadas',
    description: 'Estilo e proteção para soldadores profissionais.',
    url: 'https://gringa-style.netlify.app',
    images: [{ url: '/imagens/logo_gringa_style.png', width: 800, height: 600 }],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default async function Home() {
  const [productsRes, categoriesRes, configRes] = await Promise.all([
    // Adicionamos media_urls e produtos_relacionados_ids para satisfazer o TypeScript
    // Limitamos a 12 produtos para Lazy Loading inicial hiper-rápido.
    supabase.from('produtos').select('id, nome, preco, preco_promocional, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids').order('created_at', { ascending: false }).limit(12),
    supabase.from('categorias').select('*').order('nome'),
    supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle()
  ]);

  // Forçamos a tipagem para Product[] para o TypeScript aprovar a compilação
  const products = (productsRes.data || []) as Product[];
  const categories = categoriesRes.data || [];
  const diasNovo = configRes.data ? parseInt(configRes.data.valor) : 7;

  return (
    <main>
      <HomeContent
        initialProducts={products}
        categories={categories}
        diasNovo={diasNovo}
      />
    </main>
  );
}


