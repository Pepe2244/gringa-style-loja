import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // AVISO ESTRATÉGICO: Quando você comprar o domínio oficial, altere esta variável imediatamente.
  const baseUrl = 'https://gringa-style.netlify.app';

  // Busca todos os produtos no banco para indexação
  const { data: products } = await supabase
    .from('produtos')
    .select('id, nome, slug, created_at');

  // Mapeia os produtos para o formato que o Google exige
  const productUrls: MetadataRoute.Sitemap = (products || []).map((product) => {
    // Usa o slug limpo do banco. Fallback de segurança mantido.
    const productSlug = product.slug || `${product.id}-${product.nome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`;

    return {
      url: `${baseUrl}/produto/${productSlug}`,
      lastModified: new Date(product.created_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8, // Prioridade alta para produtos
    };
  });

  // Define as rotas estáticas principais do seu funil
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0, // Home é a página mais importante
    },
    {
      url: `${baseUrl}/rifa`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9, // Alto volume de tráfego, manter indexado frequentemente
    },
    {
      url: `${baseUrl}/carrinho`,
      lastModified: new Date(),
      changeFrequency: 'never',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/historico`,
      lastModified: new Date(),
      changeFrequency: 'never',
      priority: 0.5,
    }
  ];

  return [...staticUrls, ...productUrls];
}

