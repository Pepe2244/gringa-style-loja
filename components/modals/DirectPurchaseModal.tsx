import { useState } from 'react';
import { Product } from '@/types';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';

interface DirectPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    variant: { tipo: string; opcao: string } | null;
}

export default function DirectPurchaseModal({
    isOpen,
    onClose,
    product,
    variant
}: DirectPurchaseModalProps) {
    const { showToast } = useToast();
    const [clientName, setClientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');

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
        let message = `Olá, Gringa Style! 👋\n\nMeu nome é *${clientName}* e eu gostaria de comprar este item:\n\n`;
        message += `*Produto:* ${product.nome}`;
        if (variant) {
            message += ` (${variant.tipo}: ${variant.opcao})`;
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
                        {variant && <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{variant.tipo}: {variant.opcao}</p>}
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--cor-destaque)' }}>
                            R$ {getPrecoFinal(product).toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="campo-cliente">
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

            <button className="btn btn-finalizar" onClick={handleDirectPurchase}>Confirmar Pedido no WhatsApp</button>
        </Modal>
    );
}
