import { supabase } from '@/lib/supabase';
import HomeContent from '@/components/home/HomeContent';

export const revalidate = 60;

export default async function Home() {
  const [productsRes, categoriesRes, configRes] = await Promise.all([
    supabase.from('produtos').select('id, nome, preco, preco_promocional, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug').order('id', { ascending: true }),
    supabase.from('categorias').select('*').order('nome'),
    supabase.from('configuracoes').select('*').eq('chave', 'dias_novo').maybeSingle()
  ]);

  const products = productsRes.data || [];
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


