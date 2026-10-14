import { NextRequest, NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/lib/site-config';
import { slugify } from '@/utils/slugify';

export async function GET() {
  try {
    // Busca produtos em estoque para indexação completa
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome, slug')
      .eq('em_estoque', true);

    const productUrls = (produtos || []).map((p: any) => {
      const canonicalSlug = (p.slug && String(p.slug).trim().length > 0)
        ? String(p.slug).trim()
        : slugify(p.nome) || String(p.id);
      return `${siteConfig.appUrl}/produto/${canonicalSlug}`;
    });

    const result = await submitToIndexNow(productUrls);
    return NextResponse.json(result, { status: result.success ? 200 : result.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const urls = Array.isArray(body?.urls) ? body.urls : undefined;

    const result = await submitToIndexNow(urls);
    return NextResponse.json(result, { status: result.success ? 200 : result.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
