import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gringa-style.netlify.app';

  try {
    // 1. Busca Dinâmica garantindo apenas itens ativos/públicos
    const [productsRes, categoriesRes, rifasRes] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, slug, created_at')
        .eq('ativo', true) // ADICIONADO: Garante que apenas produtos ativos apareçam
        .order('created_at', { ascending: false }),
      supabase
        .from('categorias')
        .select('id, nome, slug'),
      supabase
        .from('rifas')
        .select('id, titulo, slug, created_at')
        .eq('ativa', true)
    ]);

    // 2. URLs de Produtos
    const productUrls: MetadataRoute.Sitemap = (productsRes.data || []).map((product) => ({
      url: `${baseUrl}/produto/${product.slug || product.id}`,
      lastModified: product.created_at ? new Date(product.created_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 3. URLs de Categorias
    const categoryUrls: MetadataRoute.Sitemap = (categoriesRes.data || []).map((cat) => ({
      url: `${baseUrl}/categoria/${cat.slug || cat.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 4. URLs de Rifas Ativas
    const rifasUrls: MetadataRoute.Sitemap = (rifasRes.data || []).map((rifa) => ({
      url: `${baseUrl}/rifa/${rifa.slug || rifa.id}`,
      lastModified: rifa.created_at ? new Date(rifa.created_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    // 5. Rotas Estáticas de Autoridade
    const staticUrls: MetadataRoute.Sitemap = [
      { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${baseUrl}/rifa`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ];

    return [...staticUrls, ...categoryUrls, ...productUrls, ...rifasUrls];
  } catch (error) {
    console.error('Erro crítico ao gerar sitemap dinâmico:', error);
    // Retorna pelo menos as rotas estáticas para o site não quebrar o SEO inteiramente se o banco oscilar
    return [
      { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ];
  }
}