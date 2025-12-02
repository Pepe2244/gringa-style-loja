import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://gringa-style.netlify.app'; // Replace with actual domain

    // Static routes
    const routes = [
        '',
        '/rifa',
        '/historico',
        '/carrinho',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // Dynamic routes (Products)
    const { data: products } = await supabase
        .from('produtos')
        .select('id, created_at');

    const productRoutes = products?.map((product) => ({
        url: `${baseUrl}/produto/${product.id}`,
        lastModified: product.created_at,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    })) || [];

    return [...routes, ...productRoutes];
}
