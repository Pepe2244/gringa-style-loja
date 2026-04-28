'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useImageOptimization } from '../utils/imageOptimization';

interface LazyImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    className?: string;
    style?: React.CSSProperties;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    onLoad?: () => void;
    onError?: () => void;
    sizes?: string;
    quality?: number;
    // Novas props para otimização
    autoOptimize?: boolean;
    optimizationConfig?: {
        format?: 'webp' | 'avif' | 'jpg' | 'png';
        fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
}

export default function LazyImage({
    src,
    alt,
    width,
    height,
    fill = false,
    className,
    style,
    priority = false,
    placeholder = 'blur',
    blurDataURL,
    onLoad,
    onError,
    sizes,
    quality = 75,
    autoOptimize = true,
    optimizationConfig = {}
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    // Hook para otimização de imagens
    const { optimizeImage } = useImageOptimization();

    // Otimizar URL da imagem
    const optimizedSrc = autoOptimize
        ? optimizeImage(src, {
            width,
            height,
            quality,
            ...optimizationConfig
        })
        : src;

    useEffect(() => {
        if (priority) {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Começar a carregar 50px antes de entrar na viewport
                threshold: 0.1
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    // Blur placeholder padrão se não fornecido
    const defaultBlurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    return (
        <div
            ref={imgRef}
            className={className}
            style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                ...style
            }}
        >
            {/* Skeleton loader enquanto carrega */}
            {!isLoaded && isInView && !hasError && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        zIndex: 1
                    }}
                />
            )}

            {/* Imagem de erro */}
            {hasError && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2a2a2a',
                        color: '#666',
                        fontSize: '0.8rem',
                        zIndex: 2
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📷</div>
                        <div>Imagem indisponível</div>
                    </div>
                </div>
            )}

            {/* Imagem Next.js */}
            {isInView && !hasError && (
                <Image
                    src={optimizedSrc}
                    alt={alt}
                    width={width}
                    height={height}
                    fill={fill}
                    priority={priority}
                    placeholder={placeholder}
                    blurDataURL={blurDataURL || defaultBlurDataURL}
                    onLoad={handleLoad}
                    onError={handleError}
                    sizes={sizes}
                    quality={quality}
                    style={{
                        objectFit: fill ? 'cover' : 'contain',
                        transition: 'opacity 0.3s ease-in-out',
                        opacity: isLoaded ? 1 : 0,
                        zIndex: 0
                    }}
                />
            )}

            {/* Placeholder antes de carregar */}
            {!isInView && !priority && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 0
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '2px solid #444',
                        borderTop: '2px solid var(--cor-destaque)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}