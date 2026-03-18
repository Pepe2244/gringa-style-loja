'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, CartItem, ProductVariant } from '@/types';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';
import { Share2, ShieldCheck, Truck, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import StickyCTA from './StickyCTA';
import { useCartStore } from '@/store/useCartStore';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import Image from 'next/image';

const BUCKET_URL = "https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public/gringa-style-produtos/";

const resolveOriginalUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `${BUCKET_URL}${path}`;
};

interface ProductPageContentProps {
    id: number;
    initialProduct?: Product | null;
}

export default function ProductPageContent({ id, initialProduct }: ProductPageContentProps) {
    const { showToast } = useToast();

    const [product, setProduct] = useState<Product | null>(initialProduct || null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(!initialProduct);
    const [selectedVariant, setSelectedVariant] = useState<string>('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDescExpanded, setIsDescExpanded] = useState(false);

    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [clientName, setClientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');

    useEffect(() => {
        if (!initialProduct && id) {
            fetchProduct(id);
        } else if (initialProduct) {
            setupProductState(initialProduct);
            fetchRelatedProducts(initialProduct);
            setLoading(false);
        }
    }, [id, initialProduct]);

    useEffect(() => {
        if (product && typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'view_item', {
                currency: 'BRL',
                value: product.preco_promocional || product.preco,
                items: [{
                    item_id: product.id,
                    item_name: product.nome,
                    price: product.preco_promocional || product.preco
                }]
            });
        }
    }, [product]);

    const setupProductState = (data: Product) => {
        const variants = data.variants as unknown as ProductVariant | null;
        if (variants && variants.opcoes && variants.opcoes.length > 0) {
            setSelectedVariant(variants.opcoes[0]);
        }
    };

    const fetchProduct = async (productId: number) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('produtos').select('*').eq('id', productId).single();
            if (error) throw error;
            setProduct(data);
            setupProductState(data);
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
            if (currentProduct.produtos_relacionados_ids && currentProduct.produtos_relacionados_ids.length > 0) {
                setRelatedProducts(data);
            } else {
                const sorted = data.sort((a, b) => b.id - a.id).slice(0, 4);
                setRelatedProducts(sorted);
            }
        }
    };

    const addItem = useCartStore(state => state.addItem);

    const addToCart = () => {
        if (!product) return;

        const variants = product.variants as unknown as ProductVariant | null;
        if (variants && !selectedVariant) {
            showToast(`Por favor, selecione uma opção de ${variants.tipo}`, 'error');
            return;
        }

        const price = product.preco_promocional || product.preco;

        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'add_to_cart', {
                currency: 'BRL',
                value: price,
                items: [{
                    item_id: product.id,
                    item_name: product.nome,
                    price: price,
                    quantity: 1,
                    item_variant: selectedVariant || undefined
                }]
            });
        }

        const cartItem: CartItem = {
            produto_id: product.id,
            quantidade: 1,
            variante: variants ? { tipo: variants.tipo, opcao: selectedVariant } : null
        };

        addItem(cartItem);
        showToast('Produto adicionado ao carrinho!', 'success');
    };

    const handleDirectPurchase = () => {
        if (!product) return;
        if (!clientName.trim()) {
            showToast('Por favor, preencha seu nome.', 'error');
            return;
        }

        const price = product.preco_promocional || product.preco;

        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'purchase', {
                transaction_id: `ZAP-DIRECT-${Date.now()}`,
                value: price,
                currency: 'BRL',
                items: [{
                    item_id: product.id,
                    item_name: product.nome,
                    price: price,
                    quantity: 1,
                    item_variant: selectedVariant || undefined
                }]
            });
        }

        const variants = product.variants as unknown as ProductVariant | null;
        const variantInfo = variants ? ` (${variants.tipo}: ${selectedVariant})` : '';

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
    const variants = product.variants as unknown as ProductVariant | null;
    const fallbackImage = '/imagens/gringa_style_logo.png';

    const MAX_DESC_LENGTH = 150;
    const isLongDescription = product.descricao && product.descricao.length > MAX_DESC_LENGTH;

    const isPromo = product.preco_promocional && product.preco_promocional < product.preco;
    const precoFinal = isPromo ? product.preco_promocional! : product.preco;
    const descontoPercentual = isPromo 
        ? Math.round(((product.preco - precoFinal) / product.preco) * 100) 
        : 0;

    return (
        <div className="container produto-page-container">

            {/* TÍTULO MOBILE (Estilo Mercado Livre) - Corrigido o respiro superior (marginTop: 20px) */}
            <div className="titulo-mobile-container" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', marginTop: '20px' }}>
                <h1 style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '2rem', lineHeight: '1.1', color: 'var(--cor-destaque)', margin: 0 }}>{product.nome}</h1>
                <button onClick={handleShare} className="btn-share" aria-label="Compartilhar" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0 0 0 10px' }}>
                    <Share2 size={24} />
                </button>
            </div>

            <div className="detalhe-produto-container">
                {/* COLUNA ESQUERDA: GALERIA */}
                <div className="produto-detalhe-coluna-img" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111' }}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {isPromo && (
                            <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'var(--cor-destaque)', color: '#000', padding: '6px 12px', fontWeight: '900', borderRadius: '6px', zIndex: 10, fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                {descontoPercentual}% OFF
                            </div>
                        )}

                        {videoUrl && currentImageIndex === 0 && product.video ? (
                            <video src={videoUrl} controls muted loop className="video-principal" />
                        ) : (
                            <div className="container-imagem-zoom" style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                                <Image
                                    id="produto-imagem-principal"
                                    src={currentMedia ? resolveOriginalUrl(currentMedia) : fallbackImage}
                                    alt={product.nome}
                                    fill
                                    draggable={false}
                                    style={{ objectFit: 'cover' }}
                                    priority={true}
                                />
                            </div>
                        )}

                        {mediaUrls.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '15px', position: 'absolute', bottom: '15px', width: '100%' }}>
                                {mediaUrls.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{
                                            width: idx === currentImageIndex ? '20px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            backgroundColor: idx === currentImageIndex ? 'var(--cor-destaque)' : 'rgba(255,255,255,0.5)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                        }}
                                        onClick={() => setCurrentImageIndex(idx)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="produto-miniaturas" style={{ marginTop: '20px' }}>
                        {mediaUrls.map((url, idx) => (
                            <Image
                                key={idx}
                                src={resolveOriginalUrl(url)}
                                className={`miniatura-img ${idx === currentImageIndex ? 'ativa' : ''}`}
                                onClick={() => setCurrentImageIndex(idx)}
                                alt={`Miniatura ${idx + 1}`}
                                loading="lazy"
                                width={100}
                                height={100}
                                style={{ borderRadius: '8px', border: idx === currentImageIndex ? '2px solid var(--cor-destaque)' : '2px solid transparent', objectFit: 'cover' }}
                            />
                        ))}
                    </div>
                </div>

                {/* COLUNA DIREITA: INFORMAÇÃO & CONVERSÃO */}
                <div className="produto-detalhe-coluna-info">
                    {/* TÍTULO DESKTOP - Só aparece no PC */}
                    <div className="titulo-desktop-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <h1 style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '2.5rem', lineHeight: '1.1', color: 'var(--cor-destaque)', margin: 0 }}>{product.nome}</h1>
                        <button onClick={handleShare} className="btn-share" aria-label="Compartilhar" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0 0 0 10px' }}>
                            <Share2 size={24} />
                        </button>
                    </div>

                    {product.em_estoque ? (
                        <p className="status-estoque-detalhe em-estoque" style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'rgba(40, 167, 69, 0.15)', color: '#4ade80', border: '1px solid rgba(40, 167, 69, 0.3)', marginBottom: '15px' }}>
                            ✓ Pronta Entrega
                        </p>
                    ) : (
                        <p className="status-estoque-detalhe fora-de-estoque" style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'rgba(220, 53, 69, 0.15)', color: '#f87171', border: '1px solid rgba(220, 53, 69, 0.3)', marginBottom: '15px' }}>
                            ✕ Fora de Estoque
                        </p>
                    )}

                    <div className="produto-detalhe-preco" style={{ margin: '10px 0 25px 0' }}>
                        {product.preco_promocional ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="preco-antigo" style={{ fontSize: '1.1rem', color: '#888', textDecoration: 'line-through' }}>
                                    De R$ {product.preco.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="preco-novo" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>
                                    R$ {product.preco_promocional.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        ) : (
                            <span className="preco-normal" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>
                                R$ {product.preco.toFixed(2).replace('.', ',')}
                            </span>
                        )}
                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '5px' }}>💳 Em até 12x no cartão de crédito</p>
                    </div>

                    {variants && variants.opcoes && (
                        <div className="produto-variantes" style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#eee' }}>
                                Escolha {variants.tipo}:
                            </label>
                            <select
                                className="select-variante"
                                value={selectedVariant}
                                onChange={(e) => setSelectedVariant(e.target.value)}
                                style={{ width: '100%', padding: '14px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="" disabled>Selecione uma opção</option>
                                {variants.opcoes.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="produto-detalhe-botoes" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {product.em_estoque ? (
                            <button
                                className="btn btn-adicionar"
                                onClick={addToCart}
                                style={{ padding: '18px', fontSize: '1.2rem', fontWeight: '900', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 6px 20px rgba(255, 107, 0, 0.4)', transition: 'transform 0.2s', border: 'none' }}
                            >
                                Adicionar ao Carrinho
                            </button>
                        ) : (
                            <button
                                className="btn btn-avise-me"
                                onClick={() => window.open(`https://wa.me/5515998608170?text=Olá, gostaria de ser avisado quando o produto *${product.nome}* estiver disponível novamente.`, '_blank')}
                                style={{ backgroundColor: '#444', color: 'white', width: '100%', padding: '18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                            >
                                Avise-me quando chegar
                            </button>
                        )}

                        <button
                            className="btn btn-secundario"
                            onClick={() => setShowPurchaseModal(true)}
                            disabled={!product.em_estoque}
                            style={{ padding: '16px', fontSize: '1.05rem', backgroundColor: '#222', border: '1px solid #555', color: '#fff', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            Comprar Rápido via WhatsApp
                        </button>
                    </div>

                    <div className="trust-badges" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '20px 15px', backgroundColor: '#111', borderRadius: '8px', border: '1px dashed #444' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}>
                            <ShieldCheck size={28} color="#28a745" />
                            <span>Compra<br/>100% Segura</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}>
                            <Truck size={28} color="var(--cor-destaque)" />
                            <span>Envio para<br/>todo o Brasil</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}>
                            <CreditCard size={28} color="#17a2b8" />
                            <span>Parcele em<br/>Até 12X</span>
                        </div>
                    </div>

                    <div className="produto-descricao-container" style={{ marginTop: '40px', borderTop: '1px solid #333', paddingTop: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--cor-destaque)', fontFamily: 'var(--fonte-titulos)' }}>
                            Detalhes do Equipamento
                        </h3>

                        <div style={{ color: '#bbb', lineHeight: '1.8', fontSize: '1rem' }}>
                            {isLongDescription && !isDescExpanded ? (
                                <>
                                    <p>{product.descricao?.substring(0, MAX_DESC_LENGTH)}...</p>
                                    <button 
                                        onClick={() => setIsDescExpanded(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--cor-destaque)', fontWeight: 'bold', cursor: 'pointer', padding: '15px 0', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}
                                    >
                                        Ler descrição completa <ChevronDown size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{product.descricao}</p>
                                    {isLongDescription && (
                                        <button 
                                            onClick={() => setIsDescExpanded(false)}
                                            style={{ background: 'none', border: 'none', color: '#888', fontWeight: 'bold', cursor: 'pointer', padding: '20px 0 5px 0', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}
                                        >
                                            Ocultar descrição <ChevronUp size={18} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {relatedProducts.length > 0 && (
                <section className="related-products-container" style={{ display: 'block', marginTop: '60px', borderTop: '1px solid #222', paddingTop: '40px' }}>
                    <h2 className="related-title" style={{ fontFamily: 'var(--fonte-titulos)', fontSize: '2rem', marginBottom: '30px', color: 'var(--cor-destaque)' }}>Você também pode gostar</h2>
                    <div className="related-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {relatedProducts.map(rel => {
                            const mediaUrl = rel.media_urls?.[0] || rel.imagens?.[0] || fallbackImage;
                            const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || !!rel.video;
                            const finalVideoUrl = rel.video || (isVideo ? mediaUrl : null);

                            return (
                                <Link key={rel.id} href={`/produto/${rel.slug || rel.id}`} className="related-product-card" style={{ backgroundColor: '#111', borderRadius: '12px', padding: '10px', textDecoration: 'none', border: '1px solid #222', transition: 'transform 0.2s' }}>
                                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                                        {finalVideoUrl ? (
                                            <video
                                                src={finalVideoUrl}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                muted
                                                loop
                                                playsInline
                                                onMouseOver={e => e.currentTarget.play()}
                                                onMouseOut={e => e.currentTarget.pause()}
                                            />
                                        ) : (
                                            <Image
                                                src={resolveOriginalUrl(mediaUrl)}
                                                alt={rel.nome}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '0.95rem', margin: '0 0 10px 0', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.nome}</h4>
                                    <p style={{ color: 'var(--cor-destaque)', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>R$ {(rel.preco_promocional || rel.preco).toFixed(2).replace('.', ',')}</p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            <Modal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Finalizar Pedido Rápido">
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #333' }}>
                    <img
                        src={getProxiedImageUrl(mediaUrls[0] || fallbackImage)}
                        alt={product.nome}
                        loading="lazy"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 5px 0', color: '#fff' }}>{product.nome}</h3>
                        {selectedVariant && <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 5px 0' }}>{variants?.tipo}: {selectedVariant}</p>}
                        <p style={{ fontWeight: '900', color: 'var(--cor-destaque)', fontSize: '1.2rem', margin: 0 }}>
                            R$ {(product.preco_promocional || product.preco).toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>

                <div className="campo-cliente" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#ccc', fontWeight: 'bold' }}>Seu Nome Completo</label>
                    <input
                        type="text"
                        className="input-cliente"
                        placeholder="Ex: João da Silva"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white', fontSize: '1rem', outline: 'none' }}
                    />
                </div>

                <div className="resumo-pagamento" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#ccc', fontWeight: 'bold' }}>Forma de Pagamento</label>
                    <select
                        className="select-pagamento"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="PIX">PIX (Aprovação imediata)</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                </div>

                {paymentMethod === 'Cartão de Crédito' && (
                    <div className="resumo-pagamento" style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', color: '#ccc', fontWeight: 'bold' }}>Parcelas</label>
                        <select
                            className="select-pagamento"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="1x">1x sem juros</option>
                            <option value="2x">2x sem juros</option>
                            <option value="3x">3x sem juros</option>
                            <option value="4x">4x sem juros</option>
                            <option value="5x">5x sem juros</option>
                            <option value="6x">6x sem juros</option>
                        </select>
                    </div>
                )}

                <button 
                    className="btn btn-finalizar" 
                    onClick={handleDirectPurchase}
                    style={{ width: '100%', padding: '18px', backgroundColor: '#25D366', color: 'white', fontWeight: '900', border: 'none', borderRadius: '8px', fontSize: '1.1rem', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)' }}
                >
                    Confirmar Pedido no WhatsApp
                </button>
            </Modal>

            {product && <StickyCTA product={product} />}

            {/* ESTILO RESPONSIVO PARA O LAYOUT MERCADO LIVRE */}
            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .titulo-mobile-container {
                        display: flex !important;
                        margin-top: 20px !important; /* Adicionado respiro superior para afastar do cabeçalho */
                    }
                    .titulo-desktop-container {
                        display: none !important;
                    }
                    .produto-detalhe-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .produto-detalhe-coluna-info {
                        padding-top: 0 !important;
                    }
                }
            `}} />
        </div>
    );
}


