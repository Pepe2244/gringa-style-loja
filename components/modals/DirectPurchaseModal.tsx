import { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';

interface DirectPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    initialVariant?: { tipo: string; opcao: string } | null;
}

export default function DirectPurchaseModal({
    isOpen,
    onClose,
    product,
    initialVariant
}: DirectPurchaseModalProps) {
    const { showToast } = useToast();
    const [clientName, setClientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');
    const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);

    // Effect to reset state and handle variants when product opens
    useEffect(() => {
        if (isOpen && product) {
            setClientName('');
            setPaymentMethod('PIX');
            setInstallments('1x');

            // Handle Variant Logic
            const variants = product.variants as unknown as ProductVariant;
            if (initialVariant) {
                setSelectedVariant(initialVariant);
            } else if (variants && variants.opcoes && variants.opcoes.length > 0) {
                // Auto-select first variant if none provided
                setSelectedVariant({ tipo: variants.tipo, opcao: variants.opcoes[0] });
            } else {
                setSelectedVariant(null);
            }
        }
    }, [isOpen, product, initialVariant]);

    if (!product) return null;

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const handleDirectPurchase = () => {
        if (!clientName.trim()) {
            showToast('Por favor, preencha seu nome.', 'error');
            return;
        }

        const precoFinal = getPrecoFinal(product);

        // --- INÍCIO DO RASTREAMENTO GA4 ---
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'purchase', {
                transaction_id: `ZAP-MODAL-${Date.now()}`,
                value: precoFinal,
                currency: 'BRL',
                items: [{
                    item_id: product.id,
                    item_name: product.nome,
                    price: precoFinal,
                    quantity: 1,
                    variant: selectedVariant ? `${selectedVariant.tipo}: ${selectedVariant.opcao}` : undefined
                }]
            });
        }
        // --- FIM DO RASTREAMENTO ---

        let message = `Olá, Gringa Style! 👋\n\nMeu nome é *${clientName}* e eu gostaria de comprar este item:\n\n`;
        message += `*Produto:* ${product.nome}`;

        if (selectedVariant) {
            message += `\n*Opção:* ${selectedVariant.tipo}: ${selectedVariant.opcao}`;
        }

        message += `\n*Valor:* R$ ${precoFinal.toFixed(2).replace('.', ',')}\n\n`;

        if (precoFinal < product.preco) {
            message += `_(Valor promocional)_\n\n`;
        }

        if (paymentMethod === 'Cartão de Crédito') {
            message += `*Pagamento:* ${paymentMethod} em ${installments}\n\nAguardo o link para pagamento.`;
        } else {
            message += `*Pagamento:* ${paymentMethod}\n\nAguardo a chave PIX.`;
        }

        window.open(`https://wa.me/5515998608170?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };

    const variants = product.variants as unknown as ProductVariant;
    const hasVariants = variants && variants.opcoes && variants.opcoes.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="modal-compra-direta">
            <h2 className="modal-titulo">Finalizar Pedido</h2>
            <div id="modal-compra-resumo-produto">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img
                        src={(product.media_urls?.find(u => !u.includes('.mp4')) || '/imagens/gringa_style_logo.png')}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }}
                        alt={product.nome}
                    />
                    <div>
                        <h3>{product.nome}</h3>
                        {selectedVariant && (
                            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                                {selectedVariant.tipo}: {selectedVariant.opcao}
                            </p>
                        )}
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--cor-destaque)', marginTop: '4px' }}>
                            R$ {getPrecoFinal(product).toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>
            </div>

            {hasVariants && (
                <div className="campo-variante" style={{ marginTop: '15px', marginBottom: '15px' }}>
                    <label htmlFor="modal-variante-select" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Escolha {variants.tipo}:
                    </label>
                    <select
                        id="modal-variante-select"
                        className="select-pagamento" // Reusing styling
                        value={selectedVariant?.opcao || ''}
                        onChange={(e) => setSelectedVariant({ tipo: variants.tipo, opcao: e.target.value })}
                        style={{ width: '100%' }}
                    >
                        {variants.opcoes.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="campo-cliente" style={{ marginTop: hasVariants ? '0' : '15px' }}>
                <label htmlFor="modal-nome-cliente">Seu Nome Completo</label>
                <input
                    type="text"
                    id="modal-nome-cliente"
                    className="input-cliente"
                    placeholder="Digite seu nome"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                />
            </div>

            <div className="resumo-pagamento">
                <label htmlFor="modal-forma-pagamento">Forma de Pagamento</label>
                <select
                    id="modal-forma-pagamento"
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
                    <label htmlFor="modal-numero-parcelas">Parcelas</label>
                    <select
                        id="modal-numero-parcelas"
                        className="select-pagamento"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                    >
                        <option value="1x">1x sem juros</option>
                        <option value="2x">2x</option>
                        <option value="3x">3x</option>
                        <option value="12x">12x</option>
                    </select>
                </div>
            )}

            <button className="btn btn-finalizar" onClick={handleDirectPurchase} style={{ marginTop: '20px' }}>
                Confirmar Pedido no WhatsApp
            </button>
        </Modal>
    );
}

