import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/carrinho/', '/pagamento/'],
        },
        sitemap: 'https://gringa-style.netlify.app/sitemap.xml',
    };
}
