'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { isProductPromoActive } from '@/lib/checkout-pricing';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { buildStorageUrl, buildWhatsAppUrl } from '@/lib/site-config';
import { getCanonicalProductSlug } from '@/utils/slugify';
import { trackPurchaseIntent } from '@/utils/analytics';
import { isProntaEntrega } from '@/utils/productAvailability';
import WishlistButton from '@/components/WishlistButton';

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

interface ProductCardProps {
    product: Product;
    diasNovo: number;
    onQuickView: (product: Product) => void;
    priority?: boolean;
}

const resolveMediaUrl = (path: string | unknown) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http') || path.startsWith('/')) return getProxiedImageUrl(path);
    return getProxiedImageUrl(buildStorageUrl(path));
};

export default function ProductCard({ product, diasNovo, onQuickView, priority = false }: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
    const [nowMs, setNowMs] = useState<number | null>(null);
    const lastPointerTypeRef = useRef<string>('mouse');

    // Acesso seguro às propriedades do produto
    const rawMediaUrls = (Array.isArray(product?.media_urls) && product.media_urls.length > 0)
        ? product.media_urls
        : (Array.isArray(product?.imagens) ? product.imagens : []);
    const mediaUrls = rawMediaUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);

    const rawVideoUrl = product?.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm')) || "";
    const videoUrl = resolveMediaUrl(rawVideoUrl);

    const imageUrls = mediaUrls
        .filter(url => !url.includes('.mp4') && !url.includes('.webm'))
        .map(url => {
            if (url.startsWith('http') || url.startsWith('/')) return getProxiedImageUrl(url);
            return buildStorageUrl(url);
        })
        .filter(Boolean) as string[];

    const displayImages = imageUrls.length > 0 ? imageUrls : ['/imagens/logo_gringa_style.png'];

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateMotionPreference = () => setPrefersReducedMotion(motionPreference.matches);

        checkMobile();
        updateMotionPreference();
        setNowMs(Date.now());
        window.addEventListener('resize', checkMobile);
        motionPreference.addEventListener('change', updateMotionPreference);
        return () => {
            window.removeEventListener('resize', checkMobile);
            motionPreference.removeEventListener('change', updateMotionPreference);
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const shouldPlayVideo = videoUrl && isHovered && !isMobile && !prefersReducedMotion;

        if (!prefersReducedMotion && isHovered && displayImages.length > 1 && !shouldPlayVideo) {
            interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
            }, 2000);
        } else {
            setCurrentImageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, displayImages.length, videoUrl, isMobile, prefersReducedMotion]);

    if (!product) return null;

    const isPromo = isProductPromoActive(product, nowMs ?? undefined);
    const precoOriginal = product.preco || 0;
    const precoFinal = (isPromo && product.preco_promocional && product.preco_promocional > 0 && product.preco_promocional < precoOriginal)
        ? product.preco_promocional
        : precoOriginal;

    const descontoPercentual = isPromo
        ? Math.round(((precoOriginal - precoFinal) / precoOriginal) * 100)
        : 0;

    const isNew = () => {
        if (!nowMs || !product.created_at) return false;
        const dateMs = new Date(product.created_at).getTime();
        if (Number.isNaN(dateMs)) return false;
        const limitMs = nowMs - (diasNovo || 7) * 24 * 60 * 60 * 1000;
        return dateMs > limitMs;
    };

    const shouldShowVideo = !!videoUrl && isHovered && !isMobile && !prefersReducedMotion;
    const productName = product.nome || 'Produto Sem Nome';
    const productSlug = getCanonicalProductSlug(product);
    const prontaEntrega = isProntaEntrega(product);

    const handleCardImageClick = () => {
        const isTouchInteraction =
            lastPointerTypeRef.current === 'touch' ||
            lastPointerTypeRef.current === 'pen' ||
            isMobile ||
            (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches);
        if (isTouchInteraction) {
            setIsHovered((prev) => !prev);
        }
    };

    return (
        <div
            onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') {
                    setIsHovered(true);
                }
            }}
            onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') {
                    setIsHovered(false);
                }
            }}
            style={{ position: 'relative', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
            className={`produto-card${isHovered ? ' ativo' : ''}`}
        >
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10, textAlign: 'center' }}>
                {isNew() && <span className="badge-novo" style={{ position: 'static', textAlign: 'center' }}>NOVO</span>}
                {isPromo && (
                    <span style={{ backgroundColor: 'var(--cor-destaque)', color: '#000', padding: '4px 8px', fontWeight: '900', borderRadius: '4px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', textAlign: 'center' }}>
                        {descontoPercentual}% OFF
                    </span>
                )}
            </div>

            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 11 }}>
                {!product.em_estoque ? (
                    <span className="status-estoque fora-de-estoque" style={{ position: 'static' }}>Fora de Estoque</span>
                ) : prontaEntrega ? (
                    <span className="status-estoque em-estoque" style={{ position: 'static' }}>Pronta Entrega</span>
                ) : (
                    <span className="status-estoque sob-encomenda" style={{ position: 'static' }}>Sob Encomenda</span>
                )}
                <WishlistButton product={product} variant="icon" size="sm" />
            </div>

            <div
                className="card-imagem-container"
                onPointerDown={(e) => {
                    lastPointerTypeRef.current = e.pointerType || 'mouse';
                }}
                onClick={handleCardImageClick}
                style={{ cursor: isMobile ? 'pointer' : 'default' }}
            >
                {shouldShowVideo ? (
                    <video
                        src={videoUrl}
                        className="card-video"
                        loop
                        muted
                        autoPlay
                        playsInline
                    />
                ) : (
                    <Image
                        src={displayImages[currentImageIndex]}
                        alt={`Produto ${product.nome}`}
                        fill
                        sizes="(max-width: 639px) 92vw, (max-width: 1024px) 50vw, 33vw"
                        quality={65}
                        className="card-imagem visivel"
                        style={{ objectFit: 'cover' }}
                        priority={priority}
                        fetchPriority={priority ? 'high' : 'auto'}
                        loading={priority ? 'eager' : 'lazy'}
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                    />
                )}
            </div>

            <div className="produto-info">
                <h2 style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '24px', color: 'var(--cor-destaque)', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {productName}
                </h2>
                {isPromo ? (
                    <p className="preco">
                        <span className="preco-antigo">De R$ {precoOriginal.toFixed(2).replace('.', ',')}</span>
                        <span className="preco-novo">Por R$ {precoFinal.toFixed(2).replace('.', ',')}</span>
                    </p>
                ) : (
                    <p className="preco">R$ {precoFinal.toFixed(2).replace('.', ',')}</p>
                )}

                <div className="produto-botoes">
                    {!product.em_estoque ? (
                        <button
                            className="btn btn-avise-me"
                            onClick={() => {
                                trackPurchaseIntent(product.id, productName, 'wishlist');
                                window.open(buildWhatsAppUrl(`Olá, gostaria de ser avisado quando o produto *${productName}* estiver disponível novamente.`), '_blank');
                            }}
                            style={{ backgroundColor: '#555', color: 'white' }}
                        >
                            Avise-me
                        </button>
                    ) : (
                        <button
                            className="btn btn-quick-view"
                            onClick={() => {
                                trackPurchaseIntent(product.id, productName, 'quick_view');
                                onQuickView(product);
                            }}
                            aria-label={`Compra rápida para ${productName}`}
                        >
                            {product.variants ? 'Ver Opções' : 'Compra Rápida'}
                        </button>
                    )}
                    <Link
                        href={`/produto/${productSlug}`}
                        className="btn btn-secundario"
                        aria-label={`Ver detalhes do produto ${productName}`}
                        onClick={() => trackPurchaseIntent(product.id, productName, 'buy_now')}
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
