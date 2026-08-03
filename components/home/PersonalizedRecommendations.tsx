'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import { trackEvent } from '@/utils/analytics';

interface PersonalizedRecommendationsProps {
    products: Product[];
    diasNovo: number;
    onQuickView: (product: Product) => void;
    currentProductId?: number;
}

export default function PersonalizedRecommendations({ products, diasNovo, onQuickView, currentProductId }: PersonalizedRecommendationsProps) {
    const wishlistItems = useWishlistStore(state => state.items);
    const getRecent = useRecentlyViewedStore(state => state.getRecent);
    const [mounted, setMounted] = useState(false);
    const [recommendations, setRecommendations] = useState<Product[]>([]);

    useEffect(() => {
        setMounted(true);

        const recentItems = getRecent(4);
        const signals = [...wishlistItems, ...recentItems];
        const signalCategories = signals
            .map(item => item.categoria_id)
            .filter((id): id is number => Boolean(id));
        const uniqueCategories = [...new Set(signalCategories)];

        const scoredProducts = products
            .filter(product => product.id !== currentProductId)
            .map(product => {
                let score = 0;

                if (product.em_estoque) score += 1;
                if (product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < product.preco) score += 2;
                if (product.created_at && new Date(product.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) score += 1;
                if (typeof product.categoria_id === 'number' && uniqueCategories.includes(product.categoria_id)) score += 3;
                if (signals.some(signal => signal.id === product.id)) score += 4;

                return { product, score };
            })
            .sort((a, b) => b.score - a.score)
            .map(item => item.product)
            .slice(0, 4);

        setRecommendations(scoredProducts.length > 0 ? scoredProducts : products.filter(product => product.id !== currentProductId).slice(0, 4));
    }, [products, currentProductId, wishlistItems, getRecent]);

    if (!mounted || recommendations.length === 0) {
        return null;
    }

    const handleRecommendationClick = (product: Product) => {
        trackEvent('recommendation_clicked', {
            product_id: product.id,
            product_name: product.nome,
            source: 'personalized'
        });
        onQuickView(product);
    };

    return (
        <section className="surface-card" style={{ marginBottom: '28px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={18} color="var(--cor-destaque)" />
                <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Para você</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#ccc', lineHeight: 1.6 }}>
                Produtos selecionados com base no que você já viu ou salvou, para acelerar a sua decisão.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {recommendations.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        diasNovo={diasNovo}
                        onQuickView={() => handleRecommendationClick(product)}
                        priority={index < 2}
                    />
                ))}
            </div>
        </section>
    );
}
