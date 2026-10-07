import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalida o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gringastylebr.com.br';

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/loja`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/soldas-especiais`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
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
      .map((product) => ({
        url: `${baseUrl}/produto/${product.slug || product.id}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

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
