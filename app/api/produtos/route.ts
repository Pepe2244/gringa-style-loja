import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Quebra o cache estático do Next.js. Garante leitura em tempo real.
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
      const url = new URL(request.url);
      const from = Number(url.searchParams.get('from') || '0');
      
      // Captura o limit se existir (enviado pelo frontend) e ajusta a paginação
      const limitParam = url.searchParams.get('limit');
      const to = limitParam ? from + Number(limitParam) - 1 : Number(url.searchParams.get('to') || '11');
      
      const categoryId = url.searchParams.get('categoria');
      const excludeId = url.searchParams.get('exclude');

      let query = supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, preco_pix, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
        .eq('em_estoque', true) // Produtos apagados ou esgotados não devem aparecer
        .order('created_at', { ascending: false })
        .range(from, to);

      if (categoryId) {
        // Garante que não quebre se o frontend enviar string em vez de ID numérico
        const isNumeric = !isNaN(Number(categoryId));
        if (isNumeric) {
            query = query.eq('categoria_id', Number(categoryId));
        } else {
            // Previne falha silenciosa se a coluna for tipo texto no seu banco
            query = query.eq('categoria_id', categoryId); 
        }
      }

      // Impede a recomendação de produtos duplicados (o produto que já está na tela)
      if (excludeId) {
          query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json(data || []);

  } catch (error: any) {
      console.error('Erro em GET /api/produtos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
}