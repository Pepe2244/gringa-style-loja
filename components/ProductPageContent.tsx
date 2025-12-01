'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, CartItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';
import { Share2 } from 'lucide-react';
import StickyCTA from './StickyCTA';
import { useCartStore } from '@/store/useCartStore';

interface ProductPageContentProps {
    id: number;
}

export default function ProductPageContent({ id }: ProductPageContentProps) {
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<string>('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Swipe State
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Purchase Modal State
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [clientName, setClientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');

    useEffect(() => {
        if (id) {
            fetchProduct(id);
        }
    }, [id]);

    const fetchProduct = async (productId: number) => {
        console.log('Fetching product with ID:', productId);
        setLoading(true);
        try {
            const { data, error } = await supabase.from('produtos').select('*').eq('id', productId).single();
            console.log('Fetch result:', { data, error });
            if (error) throw error;
            setProduct(data);
            if (data.variants && data.variants.opcoes && data.variants.opcoes.length > 0) {
                setSelectedVariant(data.variants.opcoes[0]);
            }
            fetchRelatedProducts(data);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (currentProduct: Product) => {
        let query = supabase.from('produtos').select('*').neq('id', currentProduct.id).limit(10);

        if (currentProduct.produtos_relacionados_ids && currentProduct.produtos_relacionados_ids.length > 0) {
            query = supabase.from('produtos').select('*').in('id', currentProduct.produtos_relacionados_ids);
        } else if (currentProduct.categoria_id) {
            query = query.eq('categoria_id', currentProduct.categoria_id);
        }

        const { data } = await query;

        if (data) {
            // If we used specific IDs, preserve order or just set them.
            // If fallback to category, randomize or keep as is.
            // Let's shuffle if it's category fallback to keep it dynamic but relevant.
            if (currentProduct.produtos_relacionados_ids && currentProduct.produtos_relacionados_ids.length > 0) {
                setRelatedProducts(data);
            } else {
                const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 4);
                setRelatedProducts(shuffled);
            }
        }
    };

    const addItem = useCartStore(state => state.addItem);


    let message = `Olá, Gringa Style! 👋\n\nMeu nome é *${clientName}* e eu gostaria de comprar este item:\n\n`;
    message += `*Produto:* ${product.nome}${variantInfo}\n`;
    message += `*Valor:* R$ ${price.toFixed(2).replace('.', ',')}\n\n`;

    if (product.preco_promocional) {
        message += `_(Valor promocional)_\n\n`;
    }

    message += `*Pagamento:* ${paymentMethod}`;
    if (paymentMethod === 'Cartão de Crédito') {
        message += ` em ${installments}`;
    }
    message += `\n\n*Aguardo o retorno!*`;

    window.open(`https://wa.me/5515998608170?text=${encodeURIComponent(message)}`, '_blank');
    setShowPurchaseModal(false);
};

const handleShare = async () => {
    if (!product) return;
    const url = window.location.href;
    const title = `${product.nome} | Gringa Style`;
    const text = `Confira ${product.nome} na Gringa Style!`;

    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    } else {
        navigator.clipboard.writeText(url);
        showToast('Link copiado para a área de transferência!', 'success');
    }
};

// Swipe Logic
const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
};

const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
};

const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const mediaUrls = product?.media_urls || product?.imagens || [];
    if (mediaUrls.length <= 1) return;

    if (isLeftSwipe) {
        setCurrentImageIndex((prev) => (prev + 1) % mediaUrls.length);
    }
    if (isRightSwipe) {
        setCurrentImageIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
    }
};

if (loading) return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando produto...</div>;
if (!product) return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Produto não encontrado.</div>;

const mediaUrls = product.media_urls || product.imagens || [];
const currentMedia = mediaUrls[currentImageIndex];
const isVideo = currentMedia?.includes('.mp4') || currentMedia?.includes('.webm') || !!product.video;
const videoUrl = product.video || (isVideo ? currentMedia : null);

return (
    <div className="container produto-page-container">
        <div className="detalhe-produto-container">
            <div
                className="produto-detalhe-coluna-img"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {videoUrl && currentImageIndex === 0 && product.video ? (
                    <video src={videoUrl} controls autoPlay muted loop className="video-principal" />
                ) : (
                    <div className="container-imagem-zoom">
                        <img
                            id="produto-imagem-principal"
                            src={currentMedia ? `${currentMedia}?format=webp&width=600&quality=80` : '/imagens/placeholder.png'}
                            alt={product.nome}
                            draggable={false}
                        />
                        {mediaUrls.length > 1 && (
                            <>
                                <button className="produto-seta" id="produto-seta-esq" onClick={() => setCurrentImageIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)}>&lt;</button>
                                <button className="produto-seta" id="produto-seta-dir" onClick={() => setCurrentImageIndex((prev) => (prev + 1) % mediaUrls.length)}>&gt;</button>
                            </>
                        )}
                    </div>
                )}

                <div className="produto-miniaturas">
                    {mediaUrls.map((url, idx) => (
                        <img
                            key={idx}
                            src={`${url}?format=webp&width=100&quality=70`}
                            className={`miniatura-img ${idx === currentImageIndex ? 'ativa' : ''}`}
                            onClick={() => setCurrentImageIndex(idx)}
                            alt={`Miniatura ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            <div className="produto-detalhe-coluna-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h1>{product.nome}</h1>
                    <button onClick={handleShare} className="btn-share" aria-label="Compartilhar" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <Share2 size={24} />
                    </button>
                </div>

                {product.em_estoque ? (
                    <p className="status-estoque-detalhe em-estoque">Disponível em estoque</p>
                ) : (
                    <p className="status-estoque-detalhe fora-de-estoque">Produto esgotado</p>
                )}

                <p className="produto-detalhe-descricao">{product.descricao}</p>

                <div className="produto-detalhe-preco">
                    {product.preco_promocional ? (
                        <>
                            <span className="preco-antigo" style={{ fontSize: '0.7em' }}>De R$ {product.preco.toFixed(2).replace('.', ',')}</span>
                            <span className="preco-novo">Por R$ {product.preco_promocional.toFixed(2).replace('.', ',')}</span>
                        </>
                        >
                        Adicionar ao Carrinho
                </button>
                ) : (
                <button
                    className="btn btn-avise-me"
                    onClick={() => window.open(`https://wa.me/5515998608170?text=Olá, gostaria de ser avisado quando o produto *${product.nome}* estiver disponível novamente.`, '_blank')}
                    style={{ backgroundColor: '#555', color: 'white', width: '100%' }}
                >
                    Avise-me quando chegar
                </button>
                    )}
                <button
                    className="btn btn-secundario"
                    onClick={() => setShowPurchaseModal(true)}
                    disabled={!product.em_estoque}
                >
                    Comprar via WhatsApp
                </button>
            </div>
        </div>
    </div>

        {
    relatedProducts.length > 0 && (
        <section className="related-products-container" style={{ display: 'block' }}>
            <h2 className="related-title">Você também pode gostar</h2>
            <div className="related-list">
                {relatedProducts.map(rel => {
                    const mediaUrl = rel.media_urls?.[0] || rel.imagens?.[0] || '/imagens/placeholder.png';
                        );
                    })}
            </div>
        </section>
    )
}

{/* Purchase Modal */ }
<Modal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Finalizar Pedido">
    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <img
            src={mediaUrls[0] || '/imagens/placeholder.png'}
            alt={product.nome}
            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
        />
        <div>
            <h3>{product.nome}</h3>
            {selectedVariant && <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{product.variants?.tipo}: {selectedVariant}</p>}
            <p style={{ fontWeight: 'bold', color: 'var(--cor-destaque)' }}>
                R$ {(product.preco_promocional || product.preco).toFixed(2).replace('.', ',')}
            </p>
        </div>
    </div>

    <div className="campo-cliente">
        <label>Seu Nome Completo</label>
        <input
            type="text"
            className="input-cliente"
            placeholder="Digite seu nome"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
        />
    </div>

    <div className="resumo-pagamento">
        <label>Forma de Pagamento</label>
        <select
            className="select-pagamento"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
        >
            <option value="PIX">PIX</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
        </select>
    </div>

    {paymentMethod === 'Cartão de Crédito' && (
        <div className="resumo-pagamento">
            <label>Parcelas</label>
            <select
                className="select-pagamento"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
            >
                <option value="1x">1x sem juros</option>
                <option value="2x">2x</option>
                <option value="3x">3x</option>
            </select>
        </div>
    )}

    <button className="btn btn-finalizar" onClick={handleDirectPurchase}>
        Confirmar Pedido no WhatsApp
    </button>
</Modal>

{ product && <StickyCTA product={product} onBuy={() => setShowPurchaseModal(true)} /> }
    </div >
);
}
