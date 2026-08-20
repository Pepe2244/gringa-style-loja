import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gringa-style.netlify.app';

  return {
    rules: [
      {
        // Regras otimizadas para motores de busca principais (indexação rápida)
        userAgent: ['Googlebot', 'Bingbot'],
        allow: '/',
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/'],
      },
      {
        // Bloqueia bots de raspagem e treinamento de IA para economizar tráfego
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'Omgilibot', 'FacebookBot', 'PerplexityBot', 'ClaudeBot', 'AnthropicAI'],
        disallow: '/',
      },
      {
        // Regras para demais rastreadores
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/'],
        crawlDelay: 5,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}