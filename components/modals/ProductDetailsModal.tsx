import { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';
import Modal from '@/components/Modal';

interface ProductDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onBuyNow: (product: Product, variant: { tipo: string; opcao: string } | null) => void;
}

export default function ProductDetailsModal({
    isOpen,
    onClose,
    product,
    onBuyNow
}: ProductDetailsModalProps) {
    const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);

    // Reset state when modal opens or product changes
    useEffect(() => {
        if (isOpen && product) {
            setCurrentModalImageIndex(0);
            const variants = product.variants as unknown as ProductVariant;
            // Auto-select first variant if available
            if (variants && variants.opcoes && variants.opcoes.length > 0) {
                setSelectedVariant({ tipo: variants.tipo, opcao: variants.opcoes[0] });
            } else {
                setSelectedVariant(null);
            }
        }
    }, [isOpen, product]);

    if (!product) return null;

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const modalImages = (product.media_urls || product.imagens || []).filter(
        url => !url.includes('.mp4') && !url.includes('.webm')
    );

    const handleBuyNow = () => {
        if (!product.em_estoque) return;

        let variantToBuy = selectedVariant;

        // Safety check: ensure a variant is selected if the product has them
        const variants = product.variants as unknown as ProductVariant;
        if (variants && variants.opcoes && variants.opcoes.length > 0 && !variantToBuy) {
            variantToBuy = {
                tipo: variants.tipo,
                opcao: variants.opcoes[0]
            };
        }

        onBuyNow(product, variantToBuy);
    };

    const isOutOfStock = !product.em_estoque;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="modal-imagem">
                {(() => {
                    const mediaUrls = product.media_urls || product.imagens || [];
                    const videoUrl = product.video || mediaUrls.find(url => url.includes('.mp4') || url.includes('.webm'));

                    if (videoUrl) {
                        return <video src={videoUrl} className="card-video" autoPlay loop muted playsInline />;
                    }

                    const currentImage = modalImages.length > 0 ? modalImages[currentModalImageIndex] : '/imagens/gringa_style_logo.png';

                    return (
                        <div style={{ position: 'relative' }}>
                            <img src={currentImage} alt={product.nome} style={{ width: '100%', borderRadius: '5px' }} />
                            {modalImages.length > 1 && (
                                <>
                                    <button
                                        className="modal-seta"
                                        id="modal-seta-esq"
                                        style={{ display: 'block' }}
                                        onClick={() => setCurrentModalImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length)}
                                    >
                                        &lt;
                                    </button>
                                    <button
                                        className="modal-seta"
                                        id="modal-seta-dir"
                                        style={{ display: 'block' }}
                                        onClick={() => setCurrentModalImageIndex((prev) => (prev + 1) % modalImages.length)}
                                    >
                                        &gt;
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })()}
            </div>
            <div className="modal-conteudo">
                <h2 className="modal-titulo">{product.nome}</h2>
                <p>{product.descricao}</p>

                {(() => {
                    const variants = product.variants as unknown as ProductVariant;
                    if (variants && variants.opcoes && variants.opcoes.length > 0) {
                        return (
                            <div className="variantes-container">
                                <label>{variants.tipo}:</label>
                                <select
                                    className="select-variante"
                                    onChange={(e) => setSelectedVariant({ tipo: variants.tipo, opcao: e.target.value })}
                                    value={selectedVariant?.opcao || variants.opcoes[0]}
                                >
                                    {variants.opcoes.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        );
                    }
                    return null;
                })()}

                <p className="modal-preco">
                    {getPrecoFinal(product) < product.preco ? (
                        <>
                            <span className="preco-antigo">De R$ {product.preco.toFixed(2).replace('.', ',')}</span>{' '}
                            <span className="preco-novo">Por R$ {getPrecoFinal(product).toFixed(2).replace('.', ',')}</span>
                        </>
                    ) : (
                        `R$ ${product.preco.toFixed(2).replace('.', ',')}`
                    )}
                </p>

                <div className="produto-botoes" style={{ justifyContent: 'center', width: '100%' }}>
                    {isOutOfStock ? (
                        <button className="btn" disabled style={{ backgroundColor: '#ccc', cursor: 'not-allowed', width: '100%' }}>
                            Produto Indisponível
                        </button>
                    ) : (
                        <button
                            className="btn btn-secundario"
                            onClick={handleBuyNow}
                            style={{ width: '100%', maxWidth: '300px' }}
                        >
                            Continuar Pedido no WhatsApp
                        </button>
                    )}
                </div>
            </div >
        </Modal >
    );
}
