import { useState } from 'react';
import { Product } from '@/types';
import Modal from '@/components/Modal';

interface ProductDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    addToCart: (product: Product, variant: { tipo: string; opcao: string } | null) => void;
    onBuyNow: (product: Product, variant: { tipo: string; opcao: string } | null) => void;
}

export default function ProductDetailsModal({
    isOpen,
    onClose,
    product,
    addToCart,
    onBuyNow
}: ProductDetailsModalProps) {
    const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);

    if (!product) return null;

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const getModalImages = () => {
        const mediaUrls = product.media_urls || product.imagens || [];
        return mediaUrls.filter(url => !url.includes('.mp4') && !url.includes('.webm'));
    };

    const modalImages = getModalImages();

    const handleAddToCart = () => {
        let variantToAdd = null;
        if (product.variants && product.variants.opcoes.length > 0) {
            if (!selectedVariant) {
                variantToAdd = {
                    tipo: product.variants.tipo,
                    opcao: product.variants.opcoes[0]
                };
            } else {
                variantToAdd = selectedVariant;
            }
        }
        addToCart(product, variantToAdd);
    };

    const handleBuyNow = () => {
        let variantToAdd = null;
        if (product.variants && product.variants.opcoes.length > 0) {
            if (!selectedVariant) {
                variantToAdd = {
                    tipo: product.variants.tipo,
                    opcao: product.variants.opcoes[0]
                };
            } else {
                variantToAdd = selectedVariant;
            }
        }
        onBuyNow(product, variantToAdd);
    };

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

                {product.variants && product.variants.opcoes.length > 0 && (
                    <div className="variantes-container">
                        <label>{product.variants.tipo}:</label>
                        <select
                            className="select-variante"
                            onChange={(e) => setSelectedVariant({ tipo: product.variants!.tipo, opcao: e.target.value })}
                            value={selectedVariant?.opcao || product.variants.opcoes[0]}
                        >
                            {product.variants.opcoes.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}

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

                <div className="produto-botoes">
                    <button className="btn" onClick={handleAddToCart}>Adicionar ao Carrinho</button>
                    <button className="btn btn-secundario" onClick={handleBuyNow}>Comprar via WhatsApp</button>
                </div>
            </div>
        </Modal>
    );
}
