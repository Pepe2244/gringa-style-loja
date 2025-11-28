'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Product, CartItem } from '@/types';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function CartPage() {
    const { showToast } = useToast();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponMessage, setCouponMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    // Checkout State
    const [clientName, setClientName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        setLoading(true);
        const savedCart = JSON.parse(localStorage.getItem('carrinho') || '[]');
        setCartItems(savedCart);

        if (savedCart.length > 0) {
            const productIds = savedCart.map((item: CartItem) => item.produto_id);
            const { data } = await supabase
                .from('produtos')
                .select('*')
                .in('id', productIds);

            if (data) setProducts(data);
        }
        setLoading(false);
    };

    const updateQuantity = (index: number, newQuantity: number) => {
        const newCart = [...cartItems];
        if (newQuantity <= 0) {
            newCart.splice(index, 1);
        } else {
            newCart[index].quantidade = newQuantity;
        }
        setCartItems(newCart);
        localStorage.setItem('carrinho', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart-updated'));

        // Reset coupon if cart changes
        if (appliedCoupon) {
            setAppliedCoupon(null);
            setCouponMessage({ text: 'Carrinho alterado. Aplique o cupom novamente.', type: 'error' });
        }
    };

    const getPrecoFinal = (p: Product) => {
        if (!p.preco_promocional || p.preco_promocional >= p.preco) {
            return p.preco;
        }
        return p.preco_promocional;
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => {
            const product = products.find(p => p.id === item.produto_id);
            return product ? total + (getPrecoFinal(product) * item.quantidade) : total;
        }, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        let discount = 0;
        if (appliedCoupon) {
            discount = appliedCoupon.desconto_calculado;
            if (discount > subtotal) discount = subtotal;
        }
        return subtotal - discount;
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage({ text: 'Digite um código de cupom.', type: 'error' });
            return;
        }

        setValidatingCoupon(true);
        setCouponMessage(null);

        const itemsToValidate = cartItems.map(item => {
            const product = products.find(p => p.id === item.produto_id);
            return {
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: product ? getPrecoFinal(product) : 0
            };
        });

        try {
            const response = await fetch('/api/validate-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo_cupom: couponCode.toUpperCase(),
                    itens_carrinho: itemsToValidate
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error('Falha na requisição');

            if (data.valido) {
                setAppliedCoupon(data.cupom);
                setCouponMessage({ text: data.mensagem, type: 'success' });
            } else {
                setAppliedCoupon(null);
                setCouponMessage({ text: data.mensagem, type: 'error' });
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponMessage({ text: 'Erro ao validar cupom.', type: 'error' });
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleCheckout = () => {
        if (!clientName.trim()) {
            showToast('Por favor, preencha seu nome.', 'error');
            return;
        }

        const subtotal = calculateSubtotal();
        const total = calculateTotal();
        const discount = appliedCoupon ? appliedCoupon.desconto_calculado : 0;

        let message = `Olá Gringa Style!\n\Meu nome é *${clientName}* e gostaria de confirmar meu pedido:\n\n`;

        cartItems.forEach(item => {
            const product = products.find(p => p.id === item.produto_id);
            if (product) {
                const price = getPrecoFinal(product);
                const variantInfo = item.variante ? ` (${item.variante.tipo}: ${item.variante.opcao})` : '';

                message += `*Produto:* ${product.nome}${variantInfo}\n`;
                message += `*Quantidade:* ${item.quantidade}\n`;
                message += `*Valor:* R$ ${(price * item.quantidade).toFixed(2).replace('.', ',')}\n\n`;
            }
        });

        message += `*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;

        if (appliedCoupon) {
            message += `*Desconto (${appliedCoupon.codigo}):* - R$ ${discount.toFixed(2).replace('.', ',')}\n`;
        }

        if (paymentMethod === 'Cartão de Crédito') {
            message += `*Total (Cartão):* R$ ${total.toFixed(2).replace('.', ',')}\n`;
            message += `*Pagamento:* ${paymentMethod} em ${installments}\n\n`;
            message += `_Aguardo o link para pagamento. (Sei que as taxas serão calculadas na próxima etapa)_`;
        } else {
            message += `*Total (PIX):* R$ ${total.toFixed(2).replace('.', ',')}\n\n`;
            message += `_Aguardo a chave PIX para o pagamento. Obrigado!_`;
        }

        window.open(`https://wa.me/5515998608170?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) {
        return <div className="container" style={{ padding: '50px 0', textAlign: 'center', color: 'white' }}>Carregando carrinho...</div>;
    }

    if (cartItems.length === 0) {
        return (
            <div className="container" id="carrinho-vazio-container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <i className="fas fa-shopping-cart" style={{ fontSize: '4rem', color: '#555', marginBottom: '20px' }}></i>
                <h2>Seu carrinho está vazio</h2>
                <p>Explore nossos produtos e adicione itens ao carrinho.</p>
                <Link href="/" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>Ver Produtos</Link>
            </div>
        );
    }

    return (
        <div className="container carrinho-container">
            <h1 className="titulo-secao">Seu Carrinho</h1>

            {cartItems.length === 0 ? (
                <div className="container" id="carrinho-vazio-container" style={{ textAlign: 'center', padding: '50px 0' }}>
                    <i className="fas fa-shopping-cart" style={{ fontSize: '4rem', color: '#555', marginBottom: '20px' }}></i>
                    <h2>Seu carrinho está vazio</h2>
                    <p>Explore nossos produtos e adicione itens ao carrinho.</p>
                    <Link href="/" className="btn" style={{ marginTop: '20px', display: 'inline-block' }}>Ver Produtos</Link>
                </div>
            ) : (
                <div className="carrinho-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
                    <div className="carrinho-lista">
                        {cartItems.map((item, index) => {
                            const product = products.find(p => p.id === item.produto_id);
                            if (!product) return null;

                            const mediaUrls = product.media_urls || product.imagens || [];
                            const imageUrl = mediaUrls.find(url => !url.includes('.mp4')) || '/imagens/gringa_style_logo.png';

                            return (
                                <div key={`${item.produto_id}-${index}`} className="item-carrinho">
                                    <div className="item-carrinho-img-container">
                                        <Link href={`/produto?id=${item.produto_id}`}>
                                            <Image
                                                src={imageUrl}
                                                alt={product.nome}
                                                width={120}
                                                height={120}
                                                className="item-carrinho-img"
                                            />
                                        </Link>
                                    </div>

                                    <div className="item-carrinho-info">
                                        <div className="item-carrinho-header">
                                            <Link href={`/produto?id=${item.produto_id}`} className="item-carrinho-nome">
                                                {product.nome}
                                            </Link>
                                        </div>

                                        <div className="item-carrinho-specs">
                                            {item.variante && (
                                                <p className="spec-item">
                                                    {item.variante.tipo}: {item.variante.opcao}
                                                </p>
                                            )}
                                        </div>

                                        <div className="item-carrinho-preco">
                                            R$ {getPrecoFinal(product).toFixed(2).replace('.', ',')}
                                        </div>

                                        <div className="item-carrinho-acoes-bottom">
                                            <div className="quantidade-container">
                                                <input
                                                    type="number"
                                                    className="input-quantidade"
                                                    value={item.quantidade}
                                                    min="1"
                                                    onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                                                />
                                            </div>
                                            <button
                                                className="btn-remover"
                                                onClick={() => setItemToDelete(index)}
                                                title="Remover item"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="carrinho-resumo" style={{ background: '#2a2a2a', padding: '25px', borderRadius: '10px', position: 'sticky', top: '20px' }}>
                        <h2 style={{ fontFamily: 'var(--font-teko)', fontSize: '2rem', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>Resumo do Pedido</h2>

                        <div className="linha-total" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#ccc' }}>
                            <span>Subtotal</span>
                            <span id="subtotal-valor">R$ {calculateSubtotal().toFixed(2).replace('.', ',')}</span>
                        </div>

                        {appliedCoupon && (
                            <div className="linha-total highlight-success" id="cupom-desconto-linha" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#00ff88' }}>
                                <span>Desconto ({appliedCoupon.codigo})</span>
                                <span id="cupom-desconto-valor">- R$ {appliedCoupon.desconto_calculado.toFixed(2).replace('.', ',')}</span>
                            </div>
                        )}

                        <div className="cupom-area" style={{ margin: '20px 0' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#aaa' }}>Tem um cupom?</label>
                            <div className="cupom-input-group" style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    type="text"
                                    id="cupom-input"
                                    placeholder="Código"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    disabled={!!appliedCoupon}
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white' }}
                                />
                                <button
                                    id="btn-aplicar-cupom"
                                    onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(null); } : handleApplyCoupon}
                                    disabled={validatingCoupon}
                                    style={{
                                        padding: '8px 15px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: appliedCoupon ? '#dc3545' : '#28a745',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {validatingCoupon ? '...' : (appliedCoupon ? 'X' : 'Aplicar')}
                                </button>
                            </div>
                            {couponMessage && (
                                <p id="cupom-mensagem" style={{ fontSize: '0.85em', marginTop: '5px', color: couponMessage.type === 'error' ? '#ff4444' : '#00ff88' }}>
                                    {couponMessage.text}
                                </p>
                            )}
                        </div>

                        <hr style={{ borderColor: '#444', margin: '20px 0' }} />

                        <div className="campo-cliente" style={{ marginBottom: '15px' }}>
                            <label htmlFor="nome-cliente" style={{ display: 'block', marginBottom: '5px' }}>Seus Dados</label>
                            <input
                                type="text"
                                id="nome-cliente"
                                className="input-cliente"
                                placeholder="Digite seu nome completo"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white' }}
                            />
                        </div>

                        <div className="resumo-pagamento" style={{ marginBottom: '20px' }}>
                            <label htmlFor="forma-pagamento" style={{ display: 'block', marginBottom: '5px' }}>Forma de Pagamento</label>
                            <select
                                id="forma-pagamento"
                                className="select-pagamento"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white' }}
                            >
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                            </select>
                        </div>

                        {paymentMethod === 'Cartão de Crédito' && (
                            <div className="resumo-pagamento" id="opcoes-parcelamento" style={{ marginBottom: '20px' }}>
                                <label htmlFor="numero-parcelas" style={{ display: 'block', marginBottom: '5px' }}>Parcelas</label>
                                <select
                                    id="numero-parcelas"
                                    className="select-pagamento"
                                    value={installments}
                                    onChange={(e) => setInstallments(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white' }}
                                >
                                    <option value="1x">1x sem juros</option>
                                    <option value="2x">2x</option>
                                    <option value="3x">3x</option>
                                    <option value="12x">12x</option>
                                </select>
                            </div>
                        )}

                        <div className="linha-total total-final" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            <span>Total</span>
                            <span id="total-valor">R$ {calculateTotal().toFixed(2).replace('.', ',')}</span>
                        </div>

                        <button
                            id="finalizar-pedido-btn"
                            className="btn btn-finalizar"
                            onClick={handleCheckout}
                            style={{
                                width: '100%',
                                padding: '15px',
                                background: '#FFA500',
                                color: 'black',
                                border: 'none',
                                borderRadius: '5px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            FINALIZAR PEDIDO VIA WHATSAPP
                        </button>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {itemToDelete !== null && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: '#222',
                        padding: '25px',
                        borderRadius: '10px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid #444',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                    }}>
                        <h3 style={{ marginBottom: '15px', color: 'white' }}>Remover Item?</h3>
                        <p style={{ marginBottom: '25px', color: '#ccc' }}>Tem certeza que deseja apagar este item do carrinho?</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    if (itemToDelete !== null) {
                                        updateQuantity(itemToDelete, 0);
                                        setItemToDelete(null);
                                    }
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: '#444',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Sim
                            </button>
                            <button
                                onClick={() => setItemToDelete(null)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    boxShadow: '0 0 10px rgba(220, 53, 69, 0.5)'
                                }}
                            >
                                Não
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
