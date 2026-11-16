'use client';

import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/home/ProductCardSkeleton';

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    diasNovo: number;
    onQuickView: (product: Product) => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
    compact?: boolean;
    id?: string;
}

export default function ProductGrid({
    products,
    loading,
    diasNovo,
    onQuickView,
    hasMore,
    loadingMore,
    onLoadMore,
    compact = false,
    id = 'vitrine-produtos',
}: ProductGridProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div
                id={id}
                className="vitrine"
                style={{
                    minHeight: compact ? 'auto' : 'calc(4 * 360px + 3 * 25px)',
                    ...(compact
                        ? {
                              containIntrinsicSize: 'auto',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                          }
                        : {}),
                    width: '100%',
                }}
            >
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : products.length === 0 ? (
                    <p style={{ color: 'white', textAlign: 'center', fontSize: '1.2em', width: '100%', gridColumn: '1 / -1' }}>
                        Nenhum produto encontrado para sua busca.
                    </p>
                ) : (
                    products.map((product, index) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            diasNovo={diasNovo}
                            onQuickView={onQuickView}
                            priority={index === 0}
                        />
                    ))
                )}
            </div>

            {hasMore && products.length > 0 && !loading && (
                <button 
                    onClick={onLoadMore} 
                    disabled={loadingMore}
                    className="btn btn-secundario" 
                    style={{ margin: '40px auto 20px auto', padding: '15px 40px', fontSize: '1.1rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    {loadingMore ? 'Carregando...' : 'Carregar Mais Produtos'}
                </button>
            )}
        </div>
    );
}