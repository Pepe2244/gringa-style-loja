import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    diasNovo: number;
    onQuickView: (product: Product) => void;
}

export default function ProductGrid({
    products,
    loading,
    diasNovo,
    onQuickView
}: ProductGridProps) {
    return (
        <div id="vitrine-produtos" className="vitrine" style={{ minHeight: '300px' }}>
            {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))
            ) : products.length === 0 ? (
                <p style={{ color: 'white', textAlign: 'center', fontSize: '1.2em' }}>Nenhum produto encontrado para sua busca.</p>
            ) : (
                products.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        diasNovo={diasNovo}
                        onQuickView={onQuickView}
                        priority={index < 4}
                    />
                ))
            )}
        </div>
    );
}
