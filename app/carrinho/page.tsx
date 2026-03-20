'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Product, CartItem } from '@/types';
import { Trash2, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useCartStore, CartState } from '@/store/useCartStore';
import { getProxiedImageUrl } from '@/utils/imageUrl';

interface ShippingOption {
    id: number;
    name: string;
    price: string | number;
    custom_price?: string | number;
    custom_delivery_time?: number;
    delivery_time: number;
}

export default function CartPage() {
    const { showToast } = useToast();
    const items = useCartStore((state: CartState) => state.items);
    const updateQuantity = useCartStore((state: CartState) => state.updateQuantity);
    const removeItem = useCartStore((state: CartState) => state.removeItem);
    const clearCart = useCartStore((state: CartState) => state.clearCart);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponMessage, setCouponMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const [clientName, setClientName] = useState('');
    const [cep, setCep] = useState('');
    const [country, setCountry] = useState('BR');
    const [loadingCep, setLoadingCep] = useState(false);
    const [endereco, setEndereco] = useState({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
    
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
    const [loadingShipping, setLoadingShipping] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const [validatedTotal, setValidatedTotal] = useState<number | null>(null);

    useEffect(() => {
        const fetchCartData = async () => {
            setLoading(true);
            if (items.length > 0) {
                const productIds = items.map((item) => item.produto_id);
                const { data } = await supabase
                    .from('produtos')
                    .select('*')
                    .in('id', productIds);

                if (data) setProducts(data);
                validateTotal(items);
            } else {
                setProducts([]);
            }
            setLoading(false);
        };

        fetchCartData();
    }, [items]);

    useEffect(() => {
        if (items.length > 0 && products.length > 0 && typeof window !== 'undefined' && (window as any).gtag) {
            const currentTotal = calculateTotal();
            const gtagItems = items.map(item => {
                const product = products.find(p => p.id === item.produto_id);
                return {
                    item_id: item.produto_id,
                    item_name: product?.nome || 'Produto',
                    price: product ? getPrecoFinal(product) : 0,
                    quantity: item.quantidade,
                    item_variant: item.variante?.opcao
                };
            });

            (window as any).gtag('event', 'view_cart', {
                currency: 'BRL',
                value: currentTotal,
                items: gtagItems
            });
        }
    }, [products, items]); 

    const validateTotal = async (cartItems: CartItem[]) => {
        try {
            const response = await fetch('/api/calculate-total', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itens: cartItems })
            });
            const data = await response.json();
            if (data.total !== undefined) {
                setValidatedTotal(data.total);
            }
        } catch (error) {
            console.error('Error validating total:', error);
            showToast('Não foi possível validar os preços. Os valores exibidos podem estar desatualizados.', 'error');
        }
    };

    const handleUpdateQuantity = (index: number, newQuantity: number) => {
        updateQuantity(index, newQuantity);

        if (appliedCoupon) {
            setAppliedCoupon(null);
            setCouponMessage({ text: 'Carrinho alterado. Aplique o cupom novamente.', type: 'error' });
        }
    };

    const confirmDelete = () => {
        if (itemToDelete === null) return;

        removeItem(itemToDelete);
        setItemToDelete(null);

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
        return items.reduce((total, item) => {
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
        
        let shippingCost = 0;
        if (selectedShipping) {
            shippingCost = parseFloat(String(selectedShipping.custom_price || selectedShipping.price));
        }

        return subtotal - discount + shippingCost;
    };

    const totalCalculado = calculateTotal();

    const calcularFrete = async (postalCode: string, selectedCountry: string) => {
        if (!postalCode) return;
        setLoadingShipping(true);
        setShippingOptions([]);
        setSelectedShipping(null);
        try {
            const shipRes = await fetch('/api/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_postal_code: postalCode, country: selectedCountry })
            });
            const shipData = await shipRes.json();
            if (Array.isArray(shipData) && shipData.length > 0) {
                setShippingOptions(shipData);
                setSelectedShipping(shipData[0]); 
            }
        } catch (e) {
            console.error('Erro ao calcular frete:', e);
        } finally {
            setLoadingShipping(false);
        }
    };

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (country === 'BR') {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            setCep(value);

            if (value.length === 8) {
                setLoadingCep(true);
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
                    const data = await res.json();
                    if (!data.erro) {
                        setEndereco(prev => ({
                            ...prev,
                            rua: data.logradouro || '',
                            bairro: data.bairro || '',
                            cidade: data.localidade || '',
                            estado: data.uf || ''
                        }));
                        calcularFrete(value, 'BR');
                    } else {
                        showToast('CEP não encontrado.', 'error');
                    }
                } catch (error) {
                    showToast('Erro ao buscar CEP.', 'error');
                } finally {
                    setLoadingCep(false);
                }
            }
        } else {
            setCep(e.target.value);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage({ text: 'Digite um código de cupom.', type: 'error' });
            return;
        }

        setValidatingCoupon(true);
        setCouponMessage(null);

        const itemsToValidate = items.map(item => {
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
            showToast('Por favor, preencha seu nome para finalizar.', 'error');
            return;
        }
        if (country === 'BR' && cep.length === 8 && (!endereco.rua || !endereco.numero)) {
            showToast('Por favor, preencha o número do seu endereço.', 'error');
            return;
        }
        if (country !== 'BR' && cep.length >= 3 && (!endereco.rua || !endereco.numero || !endereco.cidade || !endereco.estado)) {
            showToast('Por favor, preencha seu endereço completo para envios internacionais.', 'error');
            return;
        }
        if ((country === 'BR' ? cep.length === 8 : cep.length >= 3) && shippingOptions.length > 0 && !selectedShipping) {
            showToast('Por favor, selecione uma opção de frete.', 'error');
            return;
        }

        const currentProducts = products;

        const getPrecoAtual = (produtoId: number) => {
            const p = currentProducts.find(p => p.id === produtoId);
            if (!p) return 0;
            if (!p.preco_promocional || p.preco_promocional >= p.preco) return p.preco;
            return p.preco_promocional;
        };

        const subtotal = validatedTotal !== null ? validatedTotal : calculateSubtotal();
        const discountAmount = appliedCoupon ? appliedCoupon.desconto_calculado : 0;
        
        let shippingAmount = 0;
        if (selectedShipping) {
            shippingAmount = parseFloat(String(selectedShipping.custom_price || selectedShipping.price));
        }

        const finalTotal = subtotal - discountAmount + shippingAmount;

        const analyticsItems = items.map(item => {
            const product = products.find(p => p.id === item.produto_id);
            return {
                item_id: item.produto_id,
                item_name: product?.nome || 'Item Desconhecido',
                price: product ? getPrecoFinal(product) : 0,
                quantity: item.quantidade
            };
        });

        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'begin_checkout', {
                currency: 'BRL',
                value: finalTotal,
                items: analyticsItems
            });

            (window as any).gtag('event', 'purchase', {
                transaction_id: `ZAP-${Date.now()}`,
                value: finalTotal,
                currency: 'BRL',
                shipping: 0,
                items: analyticsItems
            });
        }

        let message = `Olá, Gringa Style! 👋\n\nMeu nome é *${clientName}* e eu gostaria de finalizar meu pedido:\n\n`;

        message += `🛒 *Itens:*\n`;
        items.forEach(item => {
            const product = currentProducts.find(p => p.id === item.produto_id);
            if (product) {
                const price = getPrecoAtual(item.produto_id);
                const variantInfo = item.variante ? ` (${item.variante.tipo}: ${item.variante.opcao})` : '';
                message += `• ${item.quantidade}x ${product.nome}${variantInfo} - R$ ${(price * item.quantidade).toFixed(2).replace('.', ',')}\n`;
            }
        });
        message += `\n`;

        if (country === 'BR' ? cep.length === 8 : cep.length >= 3) {
            message += `📍 *Endereço de Entrega:*\n`;
            message += `País: ${country === 'BR' ? 'Brasil' : country}\n`;
            message += `${endereco.rua}, Nº ${endereco.numero}\n`;
            if (endereco.complemento) message += `Comp: ${endereco.complemento}\n`;
            message += `${endereco.bairro} - ${endereco.cidade}/${endereco.estado}\n`;
            message += `Postal Code/CEP: ${cep}\n`;
            if (selectedShipping) {
                const sPrice = parseFloat(String(selectedShipping.custom_price || selectedShipping.price));
                const sTime = selectedShipping.custom_delivery_time || selectedShipping.delivery_time;
                message += `*Frete Escolhido:* ${selectedShipping.name} (${sTime} dias) - R$ ${sPrice.toFixed(2).replace('.', ',')}\n\n`;
            } else {
                message += `\n`;
            }
        } else {
            message += `📍 *Entrega:* (Endereço não informado)\n\n`;
        }

        message += `💳 *Pagamento:* ${paymentMethod}`;
        if (paymentMethod === 'Cartão de Crédito') {
            message += ` em ${installments}`;
        }
        message += `\n\n`;

        message += `📊 *Resumo de Valores:*\n`;
        message += `• Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
        if (selectedShipping) {
            message += `• Frete: R$ ${shippingAmount.toFixed(2).replace('.', ',')}\n`;
        }
        if (appliedCoupon) {
            message += `• Desconto (${appliedCoupon.codigo}): - R$ ${discountAmount.toFixed(2).replace('.', ',')}\n`;
        }
        message += `\n`;

        message += `💰 *TOTAL A PAGAR:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n\n`;

        message += `Aguardo as instruções finais!`;

        clearCart();
        window.location.href = `https://wa.me/5515998608170?text=${encodeURIComponent(message)}`;
    };

    if (loading && items.length > 0 && products.length === 0) {
        return (
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '40px 15px', boxSizing: 'border-box' }}>
                <div style={{ background: '#333', borderRadius: '8px', height: '40px', width: '40%', marginBottom: '30px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{ background: '#1a1a1a', borderRadius: '8px', height: '120px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                        ))}
                    </div>
                    <div style={{ flex: '1 1 300px', background: '#111', borderRadius: '10px', height: '400px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                </div>
                <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.25} }`}</style>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container" id="carrinho-vazio-container" style={{ textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={80} style={{ color: '#555', marginBottom: '25px' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Seu carrinho está vazio</h2>
                <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '1.1rem' }}>Sua próxima compra Gringa Style está esperando por você.</p>
                <Link href="/" className="btn btn-adicionar" style={{ padding: '15px 30px', fontSize: '1.1rem', borderRadius: '6px', textDecoration: 'none' }}>
                    Explorar Produtos
                </Link>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '40px 15px', boxSizing: 'border-box' }}>
            <h1 className="titulo-secao" style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '30px' }}>Finalizar Compra</h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ flex: '1 1 60%', minWidth: '300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {items.map((item, index) => {
                        const product = products.find(p => p.id === item.produto_id);
                        if (!product) return null;

                        const mediaUrls = Array.isArray(product.media_urls) ? product.media_urls : (Array.isArray(product.imagens) ? product.imagens : []);
                        const foundImg = mediaUrls.find((url: string) => url && typeof url === 'string' && !url.includes('.mp4'));
                        const imageUrl = foundImg || '/imagens/logo_gringa_style.png';

                        return (
                            <div key={`${item.produto_id}-${index}`} style={{ display: 'flex', gap: '15px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                                <div style={{ width: '100px', height: '100px', flexShrink: 0 }}>
                                    <Link href={`/produto/${item.produto_id}`}>
                                        <Image
                                            src={getProxiedImageUrl(imageUrl)}
                                            alt={product.nome}
                                            width={100}
                                            height={100}
                                            style={{ objectFit: 'cover', borderRadius: '6px', width: '100%', height: '100%' }}
                                        />
                                    </Link>
                                </div>

                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ overflow: 'hidden' }}>
                                        <Link href={`/produto/${item.produto_id}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white', textDecoration: 'none', display: 'block', paddingRight: '25px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {product.nome}
                                        </Link>
                                        {item.variante && (
                                            <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.variante.tipo}: {item.variante.opcao}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#000', borderRadius: '4px', border: '1px solid #444', flexShrink: 0 }}>
                                            <button 
                                                onClick={() => handleUpdateQuantity(index, Math.max(1, item.quantidade - 1))}
                                                style={{ background: 'none', border: 'none', color: '#fff', padding: '5px 12px', cursor: 'pointer', fontSize: '1.2rem' }}
                                            >-</button>
                                            <input
                                                type="number"
                                                value={item.quantidade}
                                                min="1"
                                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                                style={{ width: '30px', textAlign: 'center', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', MozAppearance: 'textfield' }}
                                            />
                                            <button 
                                                onClick={() => handleUpdateQuantity(index, item.quantidade + 1)}
                                                style={{ background: 'none', border: 'none', color: '#fff', padding: '5px 12px', cursor: 'pointer', fontSize: '1.2rem' }}
                                            >+</button>
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--cor-destaque)', whiteSpace: 'nowrap' }}>
                                            R$ {(getPrecoFinal(product) * item.quantidade).toFixed(2).replace('.', ',')}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setItemToDelete(index)}
                                    title="Remover item"
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div style={{ flex: '1 1 350px', maxWidth: '100%', background: '#111', padding: '25px', borderRadius: '10px', border: '1px solid #333', position: 'sticky', top: '20px', boxSizing: 'border-box' }}>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Seu Nome Completo</label>
                        <input
                            type="text"
                            placeholder="Para quem será o pedido?"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #555', background: '#222', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <label style={{ color: '#aaa', fontSize: '0.9rem' }}>CEP de Entrega (Opcional)</label>
                            {loadingCep && <span style={{ fontSize: '0.8rem', color: '#25D366' }}>Buscando...</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', minWidth: 0 }}>
                            <select
                                value={country}
                                onChange={(e) => {
                                    setCountry(e.target.value);
                                    setCep('');
                                    setShippingOptions([]);
                                    setEndereco({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
                                }}
                                style={{ flexShrink: 0, padding: '10px', borderRadius: '6px', border: '1px solid #555', background: '#222', color: 'white' }}
                            >
                                <option value="BR">🇧🇷 Brasil</option>
                                <option value="US">🇺🇸 USA</option>
                                <option value="PT">🇵🇹 Portugal</option>
                                <option value="INT">🌍 Outro País</option>
                            </select>
                            <input
                                type="text"
                                placeholder={country === 'BR' ? "00000000" : "Postal Code"}
                                maxLength={country === 'BR' ? 8 : 20}
                                value={cep}
                                onChange={handleCepChange}
                                onBlur={() => {
                                    if (country !== 'BR' && cep.length >= 3) {
                                        calcularFrete(cep, country);
                                    }
                                }}
                                style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '6px', border: '1px solid #555', background: '#222', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                        {(country === 'BR' ? cep.length === 8 : cep.length >= 3) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input type="text" placeholder="Rua / Avenida" value={endereco.rua} onChange={e => setEndereco({...endereco, rua: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: 'white', boxSizing: 'border-box' }} />
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <input type="text" placeholder="Número" value={endereco.numero} onChange={e => setEndereco({...endereco, numero: e.target.value})} style={{ width: '80px', flexShrink: 0, padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: 'white', boxSizing: 'border-box' }} required />
                                    <input type="text" placeholder="Complemento" value={endereco.complemento} onChange={e => setEndereco({...endereco, complemento: e.target.value})} style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: 'white', boxSizing: 'border-box' }} />
                                </div>
                                <input type="text" placeholder="Bairro" value={endereco.bairro} onChange={e => setEndereco({...endereco, bairro: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: 'white', boxSizing: 'border-box' }} />
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <input type="text" placeholder="Cidade" value={endereco.cidade} onChange={e => setEndereco({...endereco, cidade: e.target.value})} style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: country === 'BR' ? '#aaa' : 'white', boxSizing: 'border-box' }} readOnly={country === 'BR'} />
                                    <input type="text" placeholder={country === 'BR' ? "UF" : "Estado"} value={endereco.estado} onChange={e => setEndereco({...endereco, estado: e.target.value})} style={{ width: '90px', flexShrink: 0, padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: country === 'BR' ? '#aaa' : 'white', textAlign: 'center', boxSizing: 'border-box' }} readOnly={country === 'BR'} />
                                </div>
                                
                                <div style={{ marginTop: '15px' }}>
                                    {loadingShipping ? (
                                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Calculando opções de frete...</div>
                                    ) : shippingOptions.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#aaa' }}>Selecione o Frete:</p>
                                            {shippingOptions.map((option) => {
                                                const priceValue = parseFloat(String(option.custom_price || option.price));
                                                const days = option.custom_delivery_time || option.delivery_time;
                                                return (
                                                    <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a1a1a', padding: '10px', borderRadius: '6px', cursor: 'pointer', border: selectedShipping?.id === option.id ? '1px solid var(--cor-destaque)' : '1px solid #333' }}>
                                                        <input 
                                                            type="radio" 
                                                            name="shipping_option" 
                                                            checked={selectedShipping?.id === option.id}
                                                            onChange={() => setSelectedShipping(option)}
                                                        />
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                            <div>
                                                                <strong style={{ color: 'white' }}>{option.name}</strong>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Até {days} dias úteis</div>
                                                            </div>
                                                            <div style={{ fontWeight: 'bold', color: 'var(--cor-destaque)' }}>
                                                                R$ {priceValue.toFixed(2).replace('.', ',')}
                                                            </div>
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    ) : !loadingShipping && endereco.cidade ? (
                                        <div style={{ color: '#ff4444', fontSize: '0.9rem' }}>Não foi possível calcular o frete automaticamente. O vendedor informará o valor.</div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Forma de Pagamento</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #555', background: '#222', color: 'white', boxSizing: 'border-box' }}
                        >
                            <option value="PIX">PIX (Aprovação Imediata)</option>
                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                        </select>
                    </div>

                    {paymentMethod === 'Cartão de Crédito' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Parcelas</label>
                            <select
                                value={installments}
                                onChange={(e) => setInstallments(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #555', background: '#222', color: 'white', boxSizing: 'border-box' }}
                            >
                                <option value="1x">1x </option>
                                <option value="2x">2x </option>
                                <option value="3x">3x </option>
                                <option value="12x">Em até 12x</option>
                            </select>
                        </div>
                    )}

                    <div style={{ margin: '20px 0' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Tem um cupom?"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon}
                                style={{ flex: 1, minWidth: 0, padding: '10px', borderRadius: '6px', border: '1px solid #555', background: '#222', color: 'white', boxSizing: 'border-box' }}
                            />
                            <button
                                onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(null); } : handleApplyCoupon}
                                disabled={validatingCoupon}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: appliedCoupon ? '#dc3545' : '#444',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {validatingCoupon ? '...' : (appliedCoupon ? 'Remover' : 'Aplicar')}
                            </button>
                        </div>
                        {couponMessage && (
                            <p style={{ fontSize: '0.85em', marginTop: '8px', color: couponMessage.type === 'error' ? '#ff4444' : '#00ff88' }}>
                                {couponMessage.text}
                            </p>
                        )}
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#333', margin: '25px 0' }} />

                    <h2 style={{ fontSize: '1.3rem', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Resumo Final do Pedido</h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#ccc' }}>
                        <span>Subtotal ({items.length} itens)</span>
                        <span style={{ whiteSpace: 'nowrap' }}>R$ {calculateSubtotal().toFixed(2).replace('.', ',')}</span>
                    </div>

                    {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#00ff88' }}>
                            <span>Desconto ({appliedCoupon.codigo})</span>
                            <span style={{ whiteSpace: 'nowrap' }}>- R$ {appliedCoupon.desconto_calculado.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#ccc' }}>
                        <span>Frete</span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                            {selectedShipping ? `+ R$ ${parseFloat(String(selectedShipping.custom_price || selectedShipping.price)).toFixed(2).replace('.', ',')}` : 'A calcular'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '25px 0', fontSize: '1.8rem', fontWeight: '900', color: 'white', alignItems: 'center' }}>
                        <span>Total</span>
                        <span style={{ whiteSpace: 'nowrap' }}>R$ {totalCalculado.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: '#25D366', 
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                            boxSizing: 'border-box'
                        }}
                    >
                        FINALIZAR PEDIDO NO ZAP
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px', color: '#888' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                            <ShieldCheck size={20} color="#28a745" /> <span>Compra Segura</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                            <Truck size={20} color="var(--cor-destaque)" /> <span>Envio Rápido</span>
                        </div>
                    </div>
                </div>
            </div>

            {itemToDelete !== null && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#222', padding: '30px', borderRadius: '10px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid #444', boxSizing: 'border-box'
                    }}>
                        <h3 style={{ marginBottom: '15px', color: 'white', fontSize: '1.5rem' }}>Remover Item?</h3>
                        <p style={{ marginBottom: '25px', color: '#aaa' }}>Tem certeza que deseja apagar este item do carrinho?</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setItemToDelete(null)}
                                style={{ padding: '12px 25px', borderRadius: '6px', border: 'none', backgroundColor: '#444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Manter Item
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{ padding: '12px 25px', borderRadius: '6px', border: 'none', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Sim, Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


