import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.appUrl;

  return {
    rules: [
      {
        // Regras para todos os motores de busca legítimos (Google, Bing, etc.)
        userAgent: '*',
        allow: ['/', '/api/google-feed'],
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/', '/busca', '/busca/'],
      },
      {
        // Bloqueia bots de raspagem massiva e treinamento de IA
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'Omgilibot', 'PerplexityBot', 'ClaudeBot', 'AnthropicAI'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}