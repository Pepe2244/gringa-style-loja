import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

/**
 * SITEMAP ESTRATÉGICO - GRINGA STYLE
 * Garante que o Google indexe os produtos e as novas políticas antes do prazo do Merchant Center.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gringa-style.netlify.app';

  // 1. Busca Dinâmica de Produtos no Supabase
  const { data: products } = await supabase
    .from('produtos')
    .select('id, nome, slug, created_at');

  const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => {
    // Lógica de slug robusta para SEO
    const productSlug = product.slug || `${product.id}-${product.nome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`;

    return {
      url: `${baseUrl}/produto/${productSlug}`,
      lastModified: new Date(product.created_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  });

  // 2. Rotas Estáticas de Autoridade
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/devolucao-e-reembolso`, // A PÁGINA QUE SALVA O MERCHANT CENTER
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rifa`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }
  ];

  return [...staticUrls, ...productUrls];
}