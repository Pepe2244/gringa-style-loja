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

  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Storebot-Google', 'Google-InspectionTool'],
        allow: publicFeeds,
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/busca'],
      },
      {
        userAgent: ['facebookexternalhit', 'Facebot', 'Meta-ExternalAgent'],
        allow: publicFeeds,
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/busca'],
      },
      {
        userAgent: ['Pinterest', 'Pinterestbot'],
        allow: publicFeeds,
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/busca'],
      },
      {
        userAgent: '*',
        allow: publicFeeds,
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/', '/busca'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}