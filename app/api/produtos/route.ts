import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get('from') || '0');
  const to = Number(url.searchParams.get('to') || '11');
  const categoryId = url.searchParams.get('categoria');

  const query = supabase
    .from('produtos')
    .select('id, nome, preco, preco_promocional, preco_pix, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (categoryId) {
    query.eq('categoria_id', Number(categoryId));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
