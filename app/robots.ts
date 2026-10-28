import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.appUrl;

  const publicFeeds = [
    '/',
    '/api/google-feed',
    '/api/meta-feed',
    '/api/pinterest-feed',
  ];

  const commonDisallow = [
    '/admin',
    '/admin/',
    '/carrinho',
    '/carrinho/',
    '/pagamento',
    '/pagamento/',
    '/busca',
    '/favoritos',
    '/acompanhar-rifa',
  ];

  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Storebot-Google', 'Google-InspectionTool'],
        allow: publicFeeds,
        disallow: commonDisallow,
      },
      {
        userAgent: ['facebookexternalhit', 'Facebot', 'Meta-ExternalAgent'],
        allow: publicFeeds,
        disallow: commonDisallow,
      },
      {
        userAgent: ['Pinterest', 'Pinterestbot'],
        allow: publicFeeds,
        disallow: commonDisallow,
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'PerplexityBot',
          'Applebot-Extended',
          'cohere-ai',
          'Amazonbot',
        ],
        allow: ['/', '/llms.txt', '/llms-full.txt', ...publicFeeds],
        disallow: [...commonDisallow, '/api/'],
      },
      {
        userAgent: '*',
        allow: publicFeeds,
        disallow: [...commonDisallow, '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
