import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import Image from 'next/image';

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

interface ProductCardProps {
    product: Product;
    diasNovo: number;
    onQuickView: (product: Product) => void;
    priority?: boolean;
}

// CONSTANTE ESTRATÉGICA: Centraliza a URL do bucket para facilitar manutenção futura.
const BUCKET_URL = "https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public/gringa-style-produtos/";

// Componentes de fallback para evitar erros de compilação no Canvas (ambiente sem Next.js)
const Link = ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>{children}</a>
);

export default function ProductCard({ product, diasNovo, onQuickView, priority = false }: ProductCardProps) {
    // PROTEÇÃO CRÍTICA: Evita o erro "Cannot read properties of undefined" se o produto não existir.
    if (!product) return null;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // LÓGICA DE RESOLUÇÃO DE URL: Garante que o src seja sempre uma URL válida.
    const resolveMediaUrl = (path: any) => {
        if (!path || typeof path !== 'string') return "";
        if (path.startsWith('http') || path.startsWith('/')) return getProxiedImageUrl(path);
        return getProxiedImageUrl(`${BUCKET_URL}${path}`);
    };

    // Acesso seguro às propriedades do produto
    const mediaUrls = Array.isArray(product.media_urls) ? product.media_urls :
        (Array.isArray(product.imagens) ? product.imagens : []);

    const rawVideoUrl = product.video || mediaUrls.find(url => typeof url === 'string' && (url.includes('.mp4') || url.includes('.webm'))) || "";
    // O Vídeo continuará passando pelo proxy pois next/image não suporta <video>
    const videoUrl = resolveMediaUrl(rawVideoUrl);

    // As imagens irão usar a URL original do Supabase para que a Netlify / Next.js consigam
    // fazer o download interno no servidor deles e aplicar o WebP/AVIF compression
    const imageUrls = mediaUrls
        .filter(url => typeof url === 'string' && !url.includes('.mp4') && !url.includes('.webm'))
        .map(url => {
            if (url.startsWith('http') || url.startsWith('/')) return url;
            return `${BUCKET_URL}${url}`;
        });

    const displayImages = imageUrls.length > 0 ? imageUrls : ['/imagens/logo_gringa_style.png'];

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const shouldPlayVideo = videoUrl && isHovered && !isMobile;

        if (isHovered && displayImages.length > 1 && !shouldPlayVideo) {
            interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
            }, 2000);
        } else {
            setCurrentImageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, displayImages.length, videoUrl, isMobile]);

    const getPrecoFinal = (p: Product) => {
        if (!p || !p.preco) return 0;
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const precoFinal = getPrecoFinal(product);
    const precoOriginal = product.preco || 0;
    const isPromo = precoFinal < precoOriginal;

    const descontoPercentual = isPromo
        ? Math.round(((precoOriginal - precoFinal) / precoOriginal) * 100)
        : 0;

    const isNew = () => {
        if (!product.created_at) return false;
        const date = new Date(product.created_at);
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - (diasNovo || 7));
        return date > limitDate;
    };

    const shouldShowVideo = !!videoUrl && isHovered && !isMobile;
    const productName = product.nome || 'Produto Sem Nome';
    const productSlug = product.slug || `${product.id}-${productName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`;

    return (
        <div
            className="produto-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ position: 'relative' }}
        >
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
                {isNew() && <span className="badge-novo" style={{ position: 'static' }}>NOVO</span>}
                {isPromo && (
                    <span style={{ backgroundColor: 'var(--cor-destaque)', color: '#000', padding: '4px 8px', fontWeight: '900', borderRadius: '4px', fontSize: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {descontoPercentual}% OFF
                    </span>
                )}
            </div>

            {product.em_estoque ? (
                <span className="status-estoque em-estoque">Em Estoque</span>
            ) : (
                <span className="status-estoque fora-de-estoque">Fora de Estoque</span>
            )}

            <div className="card-imagem-container">
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
                    <>
                        <Image
                            src={displayImages[0]}
                            alt={`Produto ${product.nome}`}
                            fill
                            sizes="(max-width: 639px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="card-imagem visivel"
                            style={{ objectFit: 'cover' }}
                            priority={priority}
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            quality={75}
                        />
                        {displayImages[1] && (
                            <Image
                                src={displayImages[1]}
                                alt={`Produto ${product.nome} Hover`}
                                fill
                                sizes="(max-width: 639px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                className="card-imagem hover"
                                style={{ objectFit: 'cover' }}
                                placeholder="blur"
                                blurDataURL={BLUR_DATA_URL}
                                quality={75}
                            />
                        )}
                    </>
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
                            onClick={() => window.open(`https://wa.me/5515998608170?text=Olá, gostaria de ser avisado quando o produto *${productName}* estiver disponível novamente.`, '_blank')}
                            style={{ backgroundColor: '#555', color: 'white' }}
                        >
                            Avise-me
                        </button>
                    ) : (
                        <button
                            className="btn btn-quick-view"
                            onClick={() => onQuickView(product)}
                            aria-label={`Compra rápida para ${productName}`}
                        >
                            {product.variants ? 'Ver Opções' : 'Compra Rápida'}
                        </button>
                    )}
                    <Link
                        href={`/produto/${productSlug}`}
                        className="btn btn-secundario"
                        aria-label={`Ver detalhes do produto ${productName}`}
                    >
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}