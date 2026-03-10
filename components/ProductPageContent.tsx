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

    return (
        <div className="container produto-page-container">
            <div className="detalhe-produto-container">
                <div className="produto-detalhe-coluna-img" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{ position: 'relative' }}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {videoUrl && currentImageIndex === 0 && product.video ? (
                            <video src={videoUrl} controls muted loop className="video-principal" />
                        ) : (
                            <div className="container-imagem-zoom">
                                <img
                                    id="produto-imagem-principal"
                                    src={currentMedia ? `${currentMedia}?format=webp&width=600&quality=80` : fallbackImage}
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

                        {mediaUrls.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
                                {mediaUrls.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{
                                            width: idx === currentImageIndex ? '20px' : '8px',
                                            height: '8px',
                                            borderRadius: '4px',
                                            backgroundColor: idx === currentImageIndex ? 'var(--cor-destaque)' : '#555',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setCurrentImageIndex(idx)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="produto-miniaturas" style={{ marginTop: '20px' }}>
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
                        <h1 style={{ fontSize: '1.8rem', lineHeight: '1.2', marginBottom: '10px' }}>{product.nome}</h1>
                        <button onClick={handleShare} className="btn-share" aria-label="Compartilhar" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '5px' }}>
                            <Share2 size={24} />
                        </button>
                    </div>

                    {product.em_estoque ? (
                        <p className="status-estoque-detalhe em-estoque" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.2)', marginBottom: '15px' }}>
                            Disponível em estoque
                        </p>
                    ) : (
                        <p className="status-estoque-detalhe fora-de-estoque" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.2)', marginBottom: '15px' }}>
                            Produto esgotado
                        </p>
                    )}

                    <div className="produto-detalhe-preco" style={{ margin: '10px 0 25px 0' }}>
                        {product.preco_promocional ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="preco-antigo" style={{ fontSize: '0.9rem', color: '#888', textDecoration: 'line-through' }}>
                                    De R$ {product.preco.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="preco-novo" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--cor-destaque)' }}>
                                    Por R$ {product.preco_promocional.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        ) : (
                            <span className="preco-normal" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--cor-destaque)' }}>
                                R$ {product.preco.toFixed(2).replace('.', ',')}
                            </span>
                        )}
                        <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '5px' }}>Em até 12x no cartão</p>
                    </div>

                    {variants && variants.opcoes && (
                        <div className="produto-variantes" style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#eee' }}>
                                Escolha {variants.tipo}:
                            </label>
                            <select
                                className="select-variante"
                                value={selectedVariant}
                                onChange={(e) => setSelectedVariant(e.target.value)}
                                style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '6px', fontSize: '1rem', outline: 'none' }}
                            >
                                <option value="" disabled>Selecione uma opção</option>
                                {variants.opcoes.map((opt: string) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="produto-detalhe-botoes" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {product.em_estoque ? (
                            <button
                                className="btn btn-adicionar"
                                onClick={addToCart}
                                style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '6px', boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)' }}
                            >
                                Adicionar ao Carrinho
                            </button>
                        ) : (
                            <button
                                className="btn btn-avise-me"
                                onClick={() => window.open(`https://wa.me/5515998608170?text=Olá, gostaria de ser avisado quando o produto *${product.nome}* estiver disponível novamente.`, '_blank')}
                                style={{ backgroundColor: '#444', color: 'white', width: '100%', padding: '16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
                            >
                                Avise-me quando chegar
                            </button>
                        )}
                        <button
                            className="btn btn-secundario"
                            onClick={() => setShowPurchaseModal(true)}
                            disabled={!product.em_estoque}
                            style={{ padding: '14px', fontSize: '1rem', backgroundColor: 'transparent', border: '1px solid #555', color: '#ddd', borderRadius: '6px', fontWeight: '600' }}
                        >
                            Comprar via WhatsApp
                        </button>
                    </div>

                    <div className="trust-badges" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '15px 10px', backgroundColor: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>
                            <ShieldCheck size={20} color="#28a745" />
                            <span>Compra<br/>Segura</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>
                            <Truck size={20} color="var(--cor-destaque)" />
                            <span>Envio<br/>Rápido</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>
                            <CreditCard size={20} color="#17a2b8" />
                            <span>Até 12X<br/>No Cartão</span>
                        </div>
                    </div>

                    <div className="produto-descricao-container" style={{ marginTop: '35px', borderTop: '1px solid #333', paddingTop: '25px' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#eee', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Detalhes do Produto
                        </h3>

                        <div style={{ color: '#bbb', lineHeight: '1.7', fontSize: '0.95rem' }}>
                            {isLongDescription && !isDescExpanded ? (
                                <>
                                    <p>{product.descricao?.substring(0, MAX_DESC_LENGTH)}...</p>
                                    <button 
                                        onClick={() => setIsDescExpanded(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--cor-destaque)', fontWeight: 'bold', cursor: 'pointer', padding: '10px 0', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                                    >
                                        Ler descrição completa <ChevronDown size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{product.descricao}</p>
                                    {isLongDescription && (
                                        <button 
                                            onClick={() => setIsDescExpanded(false)}
                                            style={{ background: 'none', border: 'none', color: '#888', fontWeight: 'bold', cursor: 'pointer', padding: '15px 0 5px 0', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                                        >
                                            Ocultar descrição <ChevronUp size={16} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {relatedProducts.length > 0 && (
                <section className="related-products-container" style={{ display: 'block', marginTop: '50px', borderTop: '1px solid #222', paddingTop: '40px' }}>
                    <h2 className="related-title" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Você também pode gostar</h2>
                    <div className="related-list">
                        {relatedProducts.map(rel => {
                            const mediaUrl = rel.media_urls?.[0] || rel.imagens?.[0] || fallbackImage;
                            const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || !!rel.video;
                            const finalVideoUrl = rel.video || (isVideo ? mediaUrl : null);

                            return (
                                <Link key={rel.id} href={`/produto/${rel.id}`} className="related-product-card">
                                    {finalVideoUrl ? (
                                        <video
                                            src={finalVideoUrl}
                                            className="related-product-media"
                                            muted
                                            loop
                                            playsInline
                                            onMouseOver={e => e.currentTarget.play()}
                                            onMouseOut={e => e.currentTarget.pause()}
                                        />
                                    ) : (
                                        <img
                                            src={mediaUrl}
                                            className="related-product-media"
                                            alt={rel.nome}
                                        />
                                    )}
                                    <h4 style={{ fontSize: '0.9rem', margin: '10px 0 5px 0', color: '#eee' }}>{rel.nome}</h4>
                                    <p style={{ color: 'var(--cor-destaque)', fontWeight: 'bold' }}>R$ {(rel.preco_promocional || rel.preco).toFixed(2).replace('.', ',')}</p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            <Modal isOpen={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Finalizar Pedido">
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#222', borderRadius: '8px' }}>
                    <img
                        src={mediaUrls[0] || fallbackImage}
                        alt={product.nome}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 5px 0' }}>{product.nome}</h3>
                        {selectedVariant && <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 5px 0' }}>{variants?.tipo}: {selectedVariant}</p>}
                        <p style={{ fontWeight: 'bold', color: 'var(--cor-destaque)', fontSize: '1.1rem', margin: 0 }}>
                            R$ {(product.preco_promocional || product.preco).toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>

                <div className="campo-cliente" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#ccc' }}>Seu Nome Completo</label>
                    <input
                        type="text"
                        className="input-cliente"
                        placeholder="Digite seu nome"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
                    />
                </div>

                <div className="resumo-pagamento" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#ccc' }}>Forma de Pagamento</label>
                    <select
                        className="select-pagamento"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
                    >
                        <option value="PIX">PIX (Aprovação imediata)</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                    </select>
                </div>

                {paymentMethod === 'Cartão de Crédito' && (
                    <div className="resumo-pagamento" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#ccc' }}>Parcelas</label>
                        <select
                            className="select-pagamento"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#333', color: 'white' }}
                        >
                            <option value="1x">1x sem juros</option>
                            <option value="2x">2x sem juros</option>
                            <option value="3x">3x sem juros</option>
                        </select>
                    </div>
                )}

                <button 
                    className="btn btn-finalizar" 
                    onClick={handleDirectPurchase}
                    style={{ width: '100%', padding: '15px', backgroundColor: '#25D366', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '6px', fontSize: '1.1rem', marginTop: '10px' }}
                >
                    Confirmar Pedido no WhatsApp
                </button>
            </Modal>

            {product && <StickyCTA product={product} />}
        </div>
    );
}


