import { NextRequest, NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/indexnow';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/lib/site-config';
import { getCanonicalProductSlug } from '@/utils/slugify';
import { isAdminAuthenticated, isValidAdminPassword } from '@/lib/admin-auth';

async function collectAllCanonicalUrls(): Promise<string[]> {
  const [produtosRes, categoriasRes] = await Promise.all([
    supabase.from('produtos').select('id, nome, slug').order('id', { ascending: false }),
    supabase.from('categorias').select('id').order('nome'),
  ]);

  const staticUrls = [
    `${siteConfig.appUrl}/`,
    `${siteConfig.appUrl}/loja`,
    `${siteConfig.appUrl}/rifa`,
    `${siteConfig.appUrl}/historico`,
    `${siteConfig.appUrl}/sobre`,
    `${siteConfig.appUrl}/gs-servicos-industriais`,
    `${siteConfig.appUrl}/devolucao-e-reembolso`,
    `${siteConfig.appUrl}/privacidade`,
  ];

  const categoryUrls = (categoriasRes.data || []).map(
    (c: any) => `${siteConfig.appUrl}/categoria/${c.id}`
  );

  const productUrls = (produtosRes.data || []).map((p: any) => {
    const canonicalSlug = getCanonicalProductSlug(p);
    return `${siteConfig.appUrl}/produto/${canonicalSlug}`;
  });

  return [...staticUrls, ...categoryUrls, ...productUrls];
}

async function isIndexNowAuthorized(request: NextRequest): Promise<boolean> {
  if (await isAdminAuthenticated()) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && isValidAdminPassword(token)) {
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!(await isIndexNowAuthorized(request))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const allUrls = await collectAllCanonicalUrls();
    const result = await submitToIndexNow(allUrls);
    return NextResponse.json(result, { status: result.success ? 200 : result.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isIndexNowAuthorized(request))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const urls =
      Array.isArray(body?.urls) && body.urls.length > 0
        ? body.urls
        : await collectAllCanonicalUrls();

    const result = await submitToIndexNow(urls);
    return NextResponse.json(result, { status: result.success ? 200 : result.status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
