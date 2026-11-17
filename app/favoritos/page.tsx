'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Clock, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import { supabase } from '@/lib/supabase';
import { isColumnMissingError } from '@/lib/product-service';
import { Product } from '@/types';
import ProductGrid from '@/components/home/ProductGrid';
import DirectPurchaseModal from '@/components/modals/DirectPurchaseModal';

const MAX_RECENT_ITEMS = 12;

export default function FavoritosPage() {
    const wishlistItems = useWishlistStore((state) => state.items);
    const recentItems = useRecentlyViewedStore((state) => state.items);
    const clearRecent = useRecentlyViewedStore((state) => state.clear);

    const [favorites, setFavorites] = useState<Product[]>([]);
    const [recent, setRecent] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

    useEffect(() => {
        let active = true;

        const syncStoredProducts = async () => {
            const currentFavorites = wishlistItems || [];
            const currentRecent = (recentItems || []).slice(0, MAX_RECENT_ITEMS);
            const allIds = Array.from(
                new Set([
                    ...currentFavorites.map((item) => item.id),
                    ...currentRecent.map((item) => item.id),
                ])
            );

            if (allIds.length === 0) {
                if (active) {
                    setFavorites([]);
                    setRecent([]);
                    setLoading(false);
                }
                return;
            }

            try {
                let { data, error } = await supabase
                    .from('produtos')
                    .select('id, nome, preco, preco_promocional, preco_pix, inicio_promocao, fim_promocao, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
                    .in('id', allIds);

                if (error && isColumnMissingError(error)) {
                    const fallback = await supabase
                        .from('produtos')
                        .select('id, nome, preco, preco_promocional, preco_pix, imagens, video, em_estoque, categoria_id, created_at, descricao, tags, variants, slug, media_urls, produtos_relacionados_ids')
                        .in('id', allIds);
                    data = fallback.data as any;
                    error = fallback.error;
                }

                if (error) throw error;

                const freshMap = new Map<number, Product>((data || []).map((p) => [p.id, p as Product]));
                const resolveFreshList = (list: Product[]) =>
                    list
                        .map((item) => freshMap.get(item.id))
                        .filter((item): item is Product => Boolean(item));

                if (active) {
                    setFavorites(resolveFreshList(currentFavorites));
                    setRecent(resolveFreshList(currentRecent));
                }
            } catch {
                if (active) {
                    setFavorites(currentFavorites);
                    setRecent(currentRecent);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        syncStoredProducts();

        return () => {
            active = false;
        };
    }, [wishlistItems, recentItems]);

    const handleClearHistory = () => {
        clearRecent();
        setRecent([]);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '24px 20px 60px' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <section aria-labelledby="titulo-favoritos" style={{ marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
                        <Heart size={26} color="var(--cor-destaque)" />
                        <h1
                            id="titulo-favoritos"
                            className="titulo-secao"
                            style={{ margin: 0, textAlign: 'center' }}
                        >
                            Meus Favoritos
                        </h1>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#ccc', padding: '40px' }}>
                            Carregando...
                        </div>
                    ) : favorites.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: '#ccc',
                            padding: '48px 20px',
                            backgroundColor: '#111',
                            border: '1px solid #222',
                            borderRadius: '12px'
                        }}>
                            <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                                Você ainda não adicionou nenhum produto aos favoritos.
                            </p>
                            <Link href="/loja" className="btn" style={{ textDecoration: 'none' }}>
                                Voltar para a Loja
                            </Link>
                        </div>
                    ) : (
                        <ProductGrid
                            compact
                            id="vitrine-favoritos"
                            products={favorites}
                            loading={loading}
                            diasNovo={7}
                            onQuickView={(prod) => setQuickViewProduct(prod)}
                        />
                    )}
                </section>

                {!loading && recent.length > 0 && (
                    <section
                        aria-labelledby="titulo-vistos-recentemente"
                        style={{
                            borderTop: '1px solid #222',
                            paddingTop: '36px',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={22} color="var(--cor-destaque)" />
                                <h2
                                    id="titulo-vistos-recentemente"
                                    style={{
                                        margin: 0,
                                        color: 'white',
                                        fontFamily: 'var(--fonte-titulos)',
                                        fontSize: '2rem',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    Vistos Recentemente
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearHistory}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    backgroundColor: '#161616',
                                    color: '#ccc',
                                    fontSize: '0.88rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                <Trash2 size={15} />
                                Limpar histórico
                            </button>
                        </div>

                        <ProductGrid
                            compact
                            id="vitrine-recentes"
                            products={recent}
                            loading={false}
                            diasNovo={7}
                            onQuickView={(prod) => setQuickViewProduct(prod)}
                        />
                    </section>
                )}

                <DirectPurchaseModal
                    isOpen={!!quickViewProduct}
                    onClose={() => setQuickViewProduct(null)}
                    product={quickViewProduct}
                />
            </div>
        </div>
    );
}
