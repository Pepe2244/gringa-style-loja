import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
    animate?: boolean;
}

export function Skeleton({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    className,
    style,
    animate = true
}: SkeletonProps) {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: '#2a2a2a',
                ...(animate && {
                    background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                }),
                ...style
            }}
        />
    );
}

// Skeleton específico para ProductCard
export function ProductCardSkeleton() {
    return (
        <div style={{
            backgroundColor: '#111',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #222',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {/* Imagem do produto */}
            <Skeleton
                width="100%"
                height="200px"
                borderRadius="8px"
                style={{ aspectRatio: '1' }}
            />

            {/* Título */}
            <Skeleton width="80%" height="20px" />

            {/* Preço */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Skeleton width="60px" height="18px" />
                <Skeleton width="40px" height="16px" />
            </div>

            {/* Botão */}
            <Skeleton width="100%" height="40px" borderRadius="6px" />
        </div>
    );
}

// Skeleton para página inteira de produtos
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            padding: '20px'
        }}>
            {Array.from({ length: count }, (_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Skeleton para página de produto
export function ProductPageSkeleton() {
    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '40px'
        }}>
            {/* Lado esquerdo - Imagens */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton width="100%" height="400px" borderRadius="12px" />
                <div style={{ display: 'flex', gap: '10px' }}>
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} width="80px" height="80px" borderRadius="8px" />
                    ))}
                </div>
            </div>

            {/* Lado direito - Informações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton width="90%" height="40px" />
                <Skeleton width="70%" height="30px" />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Skeleton width="100px" height="40px" borderRadius="6px" />
                    <Skeleton width="80px" height="40px" borderRadius="6px" />
                </div>
                <Skeleton width="100%" height="60px" />
                <Skeleton width="100%" height="50px" borderRadius="8px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Skeleton width="100%" height="20px" />
                    <Skeleton width="100%" height="20px" />
                    <Skeleton width="80%" height="20px" />
                </div>
            </div>
        </div>
    );
}

// Skeleton para lista de categorias
export function CategoryListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div style={{
            display: 'flex',
            gap: '15px',
            overflowX: 'auto',
            padding: '20px'
        }}>
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} width="120px" height="40px" borderRadius="20px" />
            ))}
        </div>
    );
}

// Skeleton para header de navegação
export function HeaderSkeleton() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            borderBottom: '1px solid #222'
        }}>
            <Skeleton width="120px" height="40px" />
            <div style={{ display: 'flex', gap: '20px' }}>
                <Skeleton width="100px" height="40px" />
                <Skeleton width="100px" height="40px" />
                <Skeleton width="100px" height="40px" />
                <Skeleton width="40px" height="40px" borderRadius="50%" />
            </div>
        </div>
    );
}

export default Skeleton;