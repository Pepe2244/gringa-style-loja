import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Quebra o cache estático do Next.js. Garante leitura em tempo real.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = Number(url.searchParams.get('from') ?? 0);
    const limitParam = url.searchParams.get('limit');
    const toParam = url.searchParams.get('to');
    const limit = limitParam === null ? null : Number(limitParam);
    const to = limit === null
      ? Number(toParam ?? 11)
      : from + limit - 1;

    if (
      !Number.isSafeInteger(from) || from < 0 || from > 10_000 ||
      (limit !== null && (!Number.isSafeInteger(limit) || limit < 1 || limit > 48)) ||
      !Number.isSafeInteger(to) || to < from || to - from + 1 > 48
    ) {
      return NextResponse.json({ error: 'Parâmetros de paginação inválidos.' }, { status: 400 });
    }

    const categoryId = url.searchParams.get('categoria')?.trim();
    const excludeId = url.searchParams.get('exclude')?.trim();
    if ((categoryId && categoryId.length > 100) || (excludeId && excludeId.length > 64)) {
      return NextResponse.json({ error: 'Parâmetros de filtro inválidos.' }, { status: 400 });
    }

    let query = supabase
      .from('produtos')
      .select('id, nome, preco, preco_promocional, preco_pix, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
      .eq('em_estoque', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (categoryId) {
      const isNumeric = !isNaN(Number(categoryId));
      query = isNumeric
        ? query.eq('categoria_id', Number(categoryId))
        : query.eq('categoria_id', categoryId);
    }

    if (excludeId) {
      const numEx = Number(excludeId);
      if (Number.isSafeInteger(numEx) && numEx > 0) {
        query = query.neq('id', numEx);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
      console.error('Erro em GET /api/produtos:', error);
      return NextResponse.json({ error: 'Erro ao buscar produtos.' }, { status: 500 });
  }
}