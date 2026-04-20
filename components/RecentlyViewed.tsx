'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import ProductCard from '@/components/ProductCard';

interface RecentlyViewedProps {
    currentProductId?: number;
    diasNovo?: number;
    limit?: number;
}

export default function RecentlyViewed({ currentProductId, diasNovo = 7, limit = 5 }: RecentlyViewedProps) {
    const [mounted, setMounted] = useState(false);
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const getRecent = useRecentlyViewedStore(state => state.getRecent);

    useEffect(() => {
        setMounted(true);
        const recent = getRecent(limit + 1)
            .filter(p => p.id !== currentProductId)
            .slice(0, limit);
        setRecentProducts(recent);
    }, [currentProductId, getRecent, limit]);

    if (!mounted || recentProducts.length === 0) {
        return null;
    }

    return (
        <section className="recently-viewed-section" style={{
            marginTop: '50px',
            paddingTop: '40px',
            borderTop: '1px solid #222'
        }}>
            <h2 style={{
                fontFamily: 'var(--fonte-titulos)',
                fontSize: '1.8rem',
                marginBottom: '30px',
                color: 'var(--cor-destaque)'
            }}>
                Visualizados Recentemente
            </h2>
            <div className="recently-viewed-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px'
            }}>
                {recentProducts.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        diasNovo={diasNovo}
                        onQuickView={() => {}}
                    />
                ))}
            </div>
        </section>
    );
}
