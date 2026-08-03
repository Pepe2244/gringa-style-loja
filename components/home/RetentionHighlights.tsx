'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import ProductCard from '@/components/ProductCard';

interface RetentionHighlightsProps {
    diasNovo: number;
    onQuickView: (product: Product) => void;
}

export default function RetentionHighlights({ diasNovo, onQuickView }: RetentionHighlightsProps) {
    const wishlistItems = useWishlistStore(state => state.items);
    const getRecent = useRecentlyViewedStore(state => state.getRecent);
    const [mounted, setMounted] = useState(false);
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [recent, setRecent] = useState<Product[]>([]);

    useEffect(() => {
        setMounted(true);
        setFavorites(wishlistItems.slice(0, 3));
        setRecent(getRecent(3));
    }, [wishlistItems, getRecent]);

    if (!mounted || (favorites.length === 0 && recent.length === 0)) {
        return null;
    }

    return (
        <section className="surface-card" style={{ marginBottom: '28px', padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Heart size={18} color="var(--cor-destaque)" />
                <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Continue de onde parou</h3>
            </div>

            <div style={{ display: 'grid', gap: '18px' }}>
                {favorites.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eee' }}>
                                <Heart size={16} color="var(--cor-destaque)" />
                                <span>Seus favoritos</span>
                            </div>
                            <Link href="/favoritos" style={{ color: 'var(--cor-destaque)', fontSize: '0.95rem', textDecoration: 'none' }}>
                                Ver todos
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                            {favorites.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    diasNovo={diasNovo}
                                    onQuickView={onQuickView}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {recent.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#eee' }}>
                            <Eye size={16} color="var(--cor-destaque)" />
                            <span>Visualizados recentemente</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                            {recent.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    diasNovo={diasNovo}
                                    onQuickView={onQuickView}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
