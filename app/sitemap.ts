import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalida o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gringastylebr.com.br';

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const [productsRes] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, slug, created_at, em_estoque')
        .order('id', { ascending: false }),
    ]);

    const productUrls: MetadataRoute.Sitemap = (productsRes.data || [])
      .filter((product) => product.em_estoque !== false)
      .map((product) => ({
        url: `${baseUrl}/produto/${product.slug || product.id}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));

    return [...staticUrls, ...productUrls];
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
    return staticUrls;
  }
}