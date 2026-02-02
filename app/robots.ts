import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // Regras para bots "bons" (Google, Bing)
                userAgent: ['Googlebot', 'Bingbot'],
                allow: '/',
                disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/'],
            },
            {
                // Bloqueia bots de IA e scrapers conhecidos por alto tráfego
                userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'Omgilibot', 'FacebookBot', 'PerplexityBot'],
                disallow: '/',
            },
            {
                // Regra geral para o resto
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/carrinho/', '/pagamento/', '/api/'],
                crawlDelay: 10, // Pede para esperarem 10s entre requisições
            }
        ],
        sitemap: 'https://gringa-style.netlify.app/sitemap.xml',
    };
}