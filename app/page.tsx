import { supabase } from '@/lib/supabase';
import HomeContent from '@/components/home/HomeContent';
import { Product } from '@/types';

export const revalidate = 60;

export default async function Home() {
  const [productsRes, categoriesRes, configRes] = await Promise.all([
    // Adicionamos media_urls e produtos_relacionados_ids para satisfazer o TypeScript
    // e evitar a quebra do build na Netlify, mantendo o payload seguro.
    supabase.from('produtos').select('id, nome, preco, preco_promocional, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids').order('id', { ascending: true }),
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


