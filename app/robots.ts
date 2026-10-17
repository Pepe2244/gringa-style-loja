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
      // IAs (GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended etc.)
      // NÃO têm grupo próprio de propósito: seguem a regra '*' acima e podem ler o site (veja /llms.txt).
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}