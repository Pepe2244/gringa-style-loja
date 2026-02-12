import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Tenta pegar a URL do ambiente, senão usa o fallback. 
    // Mude process.env.NEXT_PUBLIC_SITE_URL nas variáveis da Vercel/Netlify.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gringa-style.netlify.app';

    // Rotas Estáticas
    // Carrinho removido: Não desperdice crawl budget do Google indexando carrinho vazio.
    const routes = [
        { url: '', changeFreq: 'daily', priority: 1.0 },      // Home é Rei
        { url: '/rifa', changeFreq: 'daily', priority: 0.9 }, // Se for seu core business, alta prioridade
        { url: '/historico', changeFreq: 'weekly', priority: 0.7 },
    ];

    const staticMap = routes.map((route) => ({
        url: `${baseUrl}${route.url}`,
        lastModified: new Date().toISOString(),
        changeFrequency: route.changeFreq as 'daily' | 'weekly',
        priority: route.priority,
    }));

    // Rotas Dinâmicas (Produtos)
    // Selecionamos apenas o necessário para economizar banda
    const { data: products, error } = await supabase
        .from('produtos')
        .select('id, created_at');

    if (error) {
        console.error('Erro ao gerar sitemap de produtos:', error);
    }

    const productRoutes = products?.map((product) => ({
        url: `${baseUrl}/produto/${product.id}`,
        lastModified: product.created_at, // O Google ama saber quando o conteúdo foi criado/atualizado
        changeFrequency: 'weekly' as const,
        priority: 0.8, // Produtos são importantes, mas menos que a Home
    })) || [];

    return [...staticMap, ...productRoutes];
}
