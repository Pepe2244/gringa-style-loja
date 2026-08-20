import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalida o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gringa-style.netlify.app';

  // 1. Rotas Estáticas Reais da Aplicação
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/busca`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/rifa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/acompanhar-rifa`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/devolucao-e-reembolso`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    // 2. Busca de Produtos e Categorias
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, slug, created_at, em_estoque')
        .order('id', { ascending: false }),
      supabase
        .from('categorias')
        .select('id, nome, slug')
    ]);

    // 3. URLs Dinâmicas de Produtos (prioriza slug, fallback id)
    const productUrls: MetadataRoute.Sitemap = (productsRes.data || [])
      .filter((product) => product.em_estoque !== false)
      .map((product) => ({
        url: `${baseUrl}/produto/${product.slug || product.id}`,
        lastModified: product.created_at ? new Date(product.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));

    // 4. URLs de Categorias (apontando para a rota real de busca com filtro)
    const categoryUrls: MetadataRoute.Sitemap = (categoriesRes.data || []).map((cat) => {
      const catParam = cat.slug || encodeURIComponent(cat.nome.toLowerCase());
      return {
        url: `${baseUrl}/busca?categoria=${catParam}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    });

    return [...staticUrls, ...productUrls, ...categoryUrls];
  } catch (error) {
    console.error('Erro ao gerar sitemap dinâmico:', error);
    return staticUrls;
  }
}