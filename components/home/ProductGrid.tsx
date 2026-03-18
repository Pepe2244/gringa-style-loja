import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    diasNovo: number;
    onQuickView: (product: Product) => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
}

export default function ProductGrid({
    products,
    loading,
    diasNovo,
    onQuickView,
    hasMore,
    loadingMore,
    onLoadMore
}: ProductGridProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div id="vitrine-produtos" className="vitrine" style={{ minHeight: '300px', width: '100%' }}>
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : products.length === 0 ? (
                    <p style={{ color: 'white', textAlign: 'center', fontSize: '1.2em', width: '100%', gridColumn: '1 / -1' }}>Nenhum produto encontrado para sua busca.</p>
                ) : (
                    products.map((product, index) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            diasNovo={diasNovo}
                            onQuickView={onQuickView}
                            priority={index < 2}
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

