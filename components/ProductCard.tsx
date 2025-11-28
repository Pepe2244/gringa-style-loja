import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useState, useEffect } from 'react';

interface ProductCardProps {
    product: Product;
    diasNovo: number;
    onQuickView: (product: Product) => void;
    priority?: boolean;
}

export default function ProductCard({ product, diasNovo, onQuickView, priority = false }: ProductCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const mediaUrls = product.media_urls || product.imagens || [];
    const videoUrl = product.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));
    const imageUrls = mediaUrls.filter(url => !url.includes('.mp4') && !url.includes('.webm'));

    // Use logo as fallback if no images
    const displayImages = imageUrls.length > 0 ? imageUrls : ['/imagens/gringa_style_logo.png'];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHovered && displayImages.length > 1 && !videoUrl) {
            interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
            }, 2000);
        } else {
            setCurrentImageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, displayImages.length, videoUrl]);

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const precoFinal = getPrecoFinal(product);
    const isPromo = precoFinal < product.preco;

    const isNew = () => {
        if (!product.created_at) return false;
        const date = new Date(product.created_at);
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - diasNovo);
        return date > limitDate;
    };

    return (
        <div
            className="produto-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isNew() && <span className="badge-novo">NOVO</span>}
            {product.emEstoque ? (
                <span className="status-estoque em-estoque">Em Estoque</span>
            ) : (
                <span className="status-estoque fora-de-estoque">Fora de Estoque</span>
            )}

            <div className="card-imagem-container">
                {videoUrl ? (
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
                        alt={product.nome}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`card-imagem visivel`}
                        style={{ objectFit: 'cover' }}
                        priority={priority}
                    />
                )}
            </div>

            <div className="produto-info">
                <h3>{product.nome}</h3>
                {isPromo ? (
                    <p className="preco">
                        <span className="preco-antigo">De R$ {product.preco.toFixed(2).replace('.', ',')}</span>
                        <span className="preco-novo">Por R$ {precoFinal.toFixed(2).replace('.', ',')}</span>
                    </p>
                ) : (
                    <p className="preco">R$ {precoFinal.toFixed(2).replace('.', ',')}</p>
                )}

                <div className="produto-botoes">
                    {!product.emEstoque ? (
                        <button
                            className="btn btn-avise-me"
                            onClick={() => window.open(`https://wa.me/5515998608170?text=Olá, gostaria de ser avisado quando o produto *${product.nome}* estiver disponível novamente.`, '_blank')}
                            style={{ backgroundColor: '#555', color: 'white' }}
                        >
                            Avise-me
                        </button>
                    ) : (
                        <button
                            className="btn btn-quick-view"
                            onClick={() => onQuickView(product)}
                        >
                            {product.variants ? 'Ver Opções' : 'Compra Rápida'}
                        </button>
                    )}
                    <Link href={`/produto/${product.id}`} className="btn btn-secundario">
                        Ver Detalhes
                    </Link>
                </div>
            </div>
        </div>
    );
}
