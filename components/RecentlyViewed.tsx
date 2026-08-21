'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';

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
        const fetchValidProducts = async () => {
            const recent = getRecent(limit + 1)
                .filter(p => p.id !== currentProductId)
                .slice(0, limit);

            if (recent.length === 0) {
                setMounted(true);
                return;
            }

            const ids = recent.map(p => p.id);

            try {
                const { data, error } = await supabase
                    .from('produtos')
                    .select('id')
                    .in('id', ids);

                if (error) throw error;

                const validIds = data.map(p => p.id);
                const validProducts = recent.filter(p => validIds.includes(p.id));

                setRecentProducts(validProducts);
            } catch (error) {
                setRecentProducts(recent);
            } finally {
                setMounted(true);
            }
        };

        fetchValidProducts();
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