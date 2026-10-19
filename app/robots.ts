import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.appUrl;

  return {
    rules: [
      {
        userAgent: ['Googlebot', 'Storebot-Google', 'Google-InspectionTool'],
        allow: ['/', '/api/google-feed'],
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/busca'],
      },
      {
        userAgent: '*',
        allow: ['/', '/api/google-feed'],
        disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/', '/busca'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}