'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, CartItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';

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
            fetchRelatedProducts(productId);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (currentId: number) => {
        const { data } = await supabase.from('produtos').select('*').neq('id', currentId).limit(10);
        if (data) {
            // Randomize and pick 4
            const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 4);
            setRelatedProducts(shuffled);
        }
    };

    const addToCart = () => {
        if (!product) return;

        const cartItem: CartItem = {
            produto_id: product.id,
            quantidade: 1,
            variante: product.variants ? { tipo: product.variants.tipo, opcao: selectedVariant } : null
        };

        const savedCart = localStorage.getItem('carrinho');
        let cart = savedCart ? JSON.parse(savedCart) : [];

        const existingItemIndex = cart.findIndex((item: any) =>
            item.produto_id === cartItem.produto_id &&
            JSON.stringify(item.variante) === JSON.stringify(cartItem.variante)
        );

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantidade += 1;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('carrinho', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast('Produto adicionado ao carrinho!', 'success');
    };

    const handleDirectPurchase = () => {
        if (!product) return;
        if (!clientName.trim()) {
            showToast('Por favor, preencha seu nome.', 'error');
            return;
        }

        const price = product.preco_promocional || product.preco;
        const variantInfo = product.variants ? ` (${product.variants.tipo}: ${selectedVariant})` : '';

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

    if (loading) return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando produto...</div>;
    if (!product) return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Produto não encontrado.</div>;

    const mediaUrls = product.media_urls || product.imagens || [];
    const currentMedia = mediaUrls[currentImageIndex];
    const isVideo = currentMedia?.includes('.mp4') || currentMedia?.includes('.webm') || !!product.video;
    const videoUrl = product.video || (isVideo ? currentMedia : null);

    return (
        <div className="container produto-page-container">
            <div className="detalhe-produto-container">
                <div className="produto-detalhe-coluna-img">
                    {videoUrl && currentImageIndex === 0 && product.video ? (
                        <video src={videoUrl} controls autoPlay muted loop className="video-principal" />
                    ) : (
                        <div className="container-imagem-zoom">
                            <img
                                id="produto-imagem-principal"
                                src={currentMedia ? `${currentMedia}?format=webp&width=600&quality=80` : '/imagens/placeholder.png'}
                                alt={product.nome}
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
                    <h1>{product.nome}</h1>
                    {product.emEstoque ? (
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
                        ) : (
                            `R$ ${product.preco.toFixed(2).replace('.', ',')}`
                        )}
                    </div>

                    {product.variants && product.variants.opcoes && (
                        <div className="produto-variantes">
                            <label>{product.variants.tipo}:</label>
                            <select
                                className="select-variante"
                                value={selectedVariant}
                                onChange={(e) => setSelectedVariant(e.target.value)}
                            >
                                {product.variants.opcoes.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="produto-detalhe-botoes">
                        {product.emEstoque ? (
                            <button
                                className="btn btn-adicionar"
                                onClick={addToCart}
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
                            disabled={!product.emEstoque}
                        >
                            Comprar via WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {relatedProducts.length > 0 && (
                <section className="related-products-container" style={{ display: 'block' }}>
                    <h2 className="related-title">Você também pode gostar</h2>
                    <div className="related-list">
                        {relatedProducts.map(rel => {
                            const mediaUrl = rel.media_urls?.[0] || rel.imagens?.[0] || '/imagens/placeholder.png';
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
                                    <h4>{rel.nome}</h4>
                                    <p>R$ {(rel.preco_promocional || rel.preco).toFixed(2).replace('.', ',')}</p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Purchase Modal */}
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
        </div>
    );
}
