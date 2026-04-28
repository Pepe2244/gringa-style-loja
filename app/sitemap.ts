import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

/**
 * SITEMAP DINÂMICO - GRINGA STYLE
 * Estrutura de loja grande: Produtos, Categorias e Páginas Institucionais.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gringa-style.netlify.app';

  // 1. Busca Dinâmica de Produtos, Categorias e Rifas
  const [productsRes, categoriesRes, rifasRes] = await Promise.all([
    supabase.from('produtos').select('id, nome, slug, created_at').order('created_at', { ascending: false }),
    supabase.from('categorias').select('id, nome, slug'),
    supabase.from('rifas').select('id, titulo, slug, created_at').eq('ativa', true)
  ]);

  // 2. URLs de Produtos
  const productUrls: MetadataRoute.Sitemap = (productsRes.data || []).map((product) => ({
    url: `${baseUrl}/produto/${product.slug || product.id}`,
    lastModified: new Date(product.created_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. URLs de Categorias (SEO de Topo de Funil)
  const categoryUrls: MetadataRoute.Sitemap = (categoriesRes.data || []).map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug || cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 4. URLs de Rifas Ativas
  const rifasUrls: MetadataRoute.Sitemap = (rifasRes.data || []).map((rifa) => ({
    url: `${baseUrl}/rifa/${rifa.slug || rifa.id}`,
    lastModified: new Date(rifa.created_at || new Date()),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 5. Rotas Estáticas de Autoridade
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/rifa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  return [...staticUrls, ...categoryUrls, ...productUrls, ...rifasUrls];
}