import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { siteConfig } from '@/lib/site-config';
import { slugify } from '@/utils/slugify';

export const revalidate = 3600; // Revalida o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.appUrl;

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/loja`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/rifa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gs-servicos-industriais`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/devolucao-e-reembolso`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, slug, created_at')
        .order('id', { ascending: false }),
      supabase
        .from('categorias')
        .select('id, nome, created_at')
        .order('nome'),
    ]);

    const productUrls: MetadataRoute.Sitemap = (productsRes.data || [])
      .map((product) => {
        const canonicalSlug = product.slug || slugify(product.nome) || String(product.id);
        return {
          url: `${baseUrl}/produto/${canonicalSlug}`,
          lastModified: product.created_at ? new Date(product.created_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        };
      });

    const categoryUrls: MetadataRoute.Sitemap = (categoriesRes.data || [])
      .map((category) => ({
        url: `${baseUrl}/categoria/${category.id}`,
        lastModified: category.created_at ? new Date(category.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    return [...staticUrls, ...categoryUrls, ...productUrls];
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
    return staticUrls;
  }
}
