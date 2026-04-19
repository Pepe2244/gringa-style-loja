import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import { motion } from 'framer-motion';

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    diasNovo: number;
    onQuickView: (product: Product) => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

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
            <motion.div 
                id="vitrine-produtos" 
                className="vitrine" 
                style={{ minHeight: '300px', width: '100%' }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : products.length === 0 ? (
                    <motion.p 
                        style={{ color: 'white', textAlign: 'center', fontSize: '1.2em', width: '100%', gridColumn: '1 / -1' }}
                        variants={itemVariants}
                    >
                        Nenhum produto encontrado para sua busca.
                    </motion.p>
                ) : (
                    products.map((product, index) => (
                        <motion.div key={product.id} variants={itemVariants}>
                            <ProductCard
                                product={product}
                                diasNovo={diasNovo}
                                onQuickView={onQuickView}
                                priority={index < 2}
                            />
                        </motion.div>
                    ))
                )}
            </motion.div>
            
            {hasMore && products.length > 0 && !loading && (
                <motion.button 
                    onClick={onLoadMore} 
                    disabled={loadingMore}
                    className="btn btn-secundario" 
                    style={{ margin: '40px auto 20px auto', padding: '15px 40px', fontSize: '1.1rem', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    {loadingMore ? 'Carregando...' : 'Carregar Mais Produtos'}
                </motion.button>
            )}
        </div>
    );
}

