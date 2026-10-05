import { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const BUCKET_URL = "https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public/gringa-style-produtos/";

const resolveOriginalUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `${BUCKET_URL}${path}`;
};

interface ShippingOption {
    id: number;
    name: string;
    price: string | number;
    custom_price?: string | number;
    custom_delivery_time?: number;
    delivery_time: number;
    is_estimate?: boolean;
}

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
    const [cep, setCep] = useState('');
    const [country, setCountry] = useState('BR');
    const [loadingCep, setLoadingCep] = useState(false);
    const [endereco, setEndereco] = useState({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
    
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
    const [loadingShipping, setLoadingShipping] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState('1x');
    const [selectedVariant, setSelectedVariant] = useState<{ tipo: string; opcao: string } | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

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
        if (paymentMethod === 'PIX' && p.preco_pix && p.preco_pix > 0) {
            return p.preco_pix;
        }
        if (p.preco_promocional && p.preco_promocional < p.preco) {
            return p.preco_promocional;
        }
        return p.preco;
    };

    const calcularFrete = async (postalCode: string, selectedCountry: string) => {
        if (!postalCode) return;
        setLoadingShipping(true);
        setShippingOptions([]);
        setSelectedShipping(null);
        try {
            const shipRes = await fetch('/api/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    to_postal_code: postalCode, 
                    country: selectedCountry,
                    product_id: product.id
                })
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

    const handleDirectPurchase = async () => {
        if (isCheckingOut) return;
        if (!clientName.trim()) {
            showToast('Por favor, preencha seu nome.', 'error');
            return;
        }
        if (country === 'BR' && cep.length > 0 && cep.length !== 8) {
            showToast('Informe um CEP válido de 8 dígitos.', 'error');
            return;
        }
        if (country === 'BR' && cep.length === 8 && (!endereco.rua || !endereco.numero)) {
            showToast('Por favor, preencha o número do endereço.', 'error');
            return;
        }
        if (country !== 'BR' && cep.length > 0 && cep.length < 3) {
            showToast('Informe um código postal válido.', 'error');
            return;
        }
        if (country !== 'BR' && cep.length >= 3 && (!endereco.rua || !endereco.numero || !endereco.cidade || !endereco.estado)) {
            showToast('Por favor, preencha o endereço completo para envio internacional.', 'error');
            return;
        }
        if ((country === 'BR' ? cep.length === 8 : cep.length >= 3) && !selectedShipping) {
            showToast(shippingOptions.length > 0
                ? 'Por favor, selecione uma opção de frete.'
                : 'Calcule e selecione uma opção de frete antes de continuar.', 'error');
            return;
        }

        const checkoutWindow = window.open('', '_blank');
        if (!checkoutWindow) {
            showToast('Permita a abertura de pop-ups para continuar pelo WhatsApp.', 'error');
            return;
        }
        checkoutWindow.opener = null;
        checkoutWindow.document.title = 'Validando pedido...';
        checkoutWindow.document.body.textContent = 'Validando preço, estoque e frete...';
        setIsCheckingOut(true);

        try {
            const totalResponse = await fetch('/api/calculate-total', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itens: [{
                        produto_id: product.id,
                        quantidade: 1,
                        variante: selectedVariant,
                    }],
                    metodo_pagamento: paymentMethod,
                }),
            });
            const quote = await totalResponse.json();
            if (!totalResponse.ok) throw new Error(quote.error || 'Não foi possível validar o produto.');

            const hasShippingAddress = country === 'BR' ? cep.length === 8 : cep.length >= 3;
            let currentShipping = selectedShipping;
            if (hasShippingAddress && selectedShipping) {
                const shippingResponse = await fetch('/api/shipping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to_postal_code: cep, country, product_id: product.id }),
                });
                const shippingQuote = await shippingResponse.json();
                if (!shippingResponse.ok) throw new Error(shippingQuote.error || 'Não foi possível validar o frete.');
                const options: ShippingOption[] = Array.isArray(shippingQuote)
                    ? shippingQuote
                    : shippingQuote.options || [];
                currentShipping = options.find((option) => String(option.id) === String(selectedShipping.id)) || null;
                if (!currentShipping) {
                    setShippingOptions(options);
                    setSelectedShipping(null);
                    throw new Error('O frete selecionado mudou. Escolha uma opção atualizada e tente novamente.');
                }
            }

            const quotedItem = quote.itens?.[0];
            if (!quotedItem) throw new Error('Não foi possível obter o preço atualizado do produto.');
            const productPrice = Number(quotedItem.total_item);
            const shippingAmount = currentShipping
                ? Number(currentShipping.custom_price ?? currentShipping.price)
                : 0;
            const finalTotal = Number(quote.total) + shippingAmount;
            const formatCurrency = (value: number) => value.toFixed(2).replace('.', ',');

            if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
                (window as any).gtag('event', 'begin_checkout', {
                    value: finalTotal,
                    currency: 'BRL',
                    items: [{
                        item_id: product.id,
                        item_name: quotedItem.nome,
                        price: Number(quotedItem.preco_unitario),
                        quantity: 1,
                        variant: selectedVariant ? `${selectedVariant.tipo}: ${selectedVariant.opcao}` : undefined,
                    }],
                });
            }

            let message = `Olá, Gringa Style! 👋\n\nMeu nome é *${clientName}* e eu gostaria de comprar este item:\n\n`;
            message += `*Produto:* ${quotedItem.nome}`;
            if (selectedVariant) message += `\n*Opção:* ${selectedVariant.tipo}: ${selectedVariant.opcao}`;
            message += `\n*Valor:* R$ ${formatCurrency(productPrice)}\n\n`;
            message += paymentMethod === 'Cartão de Crédito'
                ? `*Pagamento:* ${paymentMethod} em ${installments}\n\n`
                : `*Pagamento:* ${paymentMethod}\n\n`;

            if (hasShippingAddress) {
                message += `📍 *Endereço de Entrega*\n`;
                message += `País: ${country === 'BR' ? 'Brasil' : country}\n`;
                message += `${endereco.rua}, Nº ${endereco.numero}\n`;
                if (endereco.complemento) message += `Comp: ${endereco.complemento}\n`;
                message += `${endereco.bairro} - ${endereco.cidade}/${endereco.estado}\n`;
                message += `Postal Code/CEP: ${cep}\n`;
                if (currentShipping) {
                    const deliveryTime = currentShipping.custom_delivery_time ?? currentShipping.delivery_time;
                    const estimate = currentShipping.is_estimate ? ' — estimativa, confirmar no WhatsApp' : '';
                    message += `*Frete Escolhido:* ${currentShipping.name} (${deliveryTime} dias) - R$ ${formatCurrency(shippingAmount)}${estimate}\n`;
                }
            } else {
                message += `📍 *Entrega:* (Endereço não informado; frete a confirmar)\n`;
            }

            if (currentShipping) {
                message += `\n*TOTAL${currentShipping.is_estimate ? ' ESTIMADO' : ''}:* R$ ${formatCurrency(finalTotal)}\n\n`;
            } else {
                message += `\n*Subtotal do produto:* R$ ${formatCurrency(finalTotal)} (frete a confirmar no WhatsApp)\n\n`;
            }
            message += `Aguardo as instruções finais!`;
            checkoutWindow.location.href = `https://wa.me/5515998092548?text=${encodeURIComponent(message)}`;
            onClose();
        } catch (error) {
            checkoutWindow.close();
            showToast(error instanceof Error ? error.message : 'Não foi possível validar o pedido.', 'error');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const variants = product.variants as unknown as ProductVariant;
    const hasVariants = variants && variants.opcoes && variants.opcoes.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="modal-compra-direta">
            <div style={{ opacity: 1, transform: 'scale(1)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
                <h2 className="modal-titulo">Finalizar Pedido</h2>
            <div id="modal-compra-resumo-produto">
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
                        <Image
                            src={resolveOriginalUrl(product.media_urls?.find(u => !u.includes('.mp4')) || '/imagens/gringa_style_logo.png')}
                            alt={product.nome}
                            fill
                            sizes="80px"
                            style={{ objectFit: 'cover' }}
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                        />
                    </div>
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
                        {paymentMethod === 'PIX' && product.preco_pix && product.preco_pix > 0 && (
                            <p style={{ fontSize: '0.85rem', color: '#fff', margin: '4px 0 0', fontWeight: '700' }}>Preço PIX</p>
                        )}
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

            <div className="endereco-container" style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label htmlFor="modal-cep" style={{ fontWeight: 'bold' }}>CEP de Entrega (Opcional)</label>
                    {loadingCep && <span style={{ fontSize: '0.8rem', color: 'var(--cor-destaque)' }}>Buscando...</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', width: '100%', minWidth: 0 }}>
                    <select
                        value={country}
                        onChange={(e) => {
                            setCountry(e.target.value);
                            setCep('');
                            setShippingOptions([]);
                            setEndereco({ rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
                        }}
                        className="select-pagamento"
                        style={{ flex: '0 0 120px', minWidth: '120px', padding: '10px' }}
                    >
                        <option value="BR">🇧🇷 Brasil</option>
                        <option value="US">🇺🇸 USA</option>
                        <option value="PT">🇵🇹 Portugal</option>
                        <option value="INT">Outro País</option>
                    </select>
                    <input
                        type="text"
                        id="modal-cep"
                        className="input-cliente"
                        placeholder={country === 'BR' ? "00000000" : "Postal Code"}
                        maxLength={country === 'BR' ? 8 : 20}
                        value={cep}
                        onChange={handleCepChange}
                        onBlur={() => {
                            if (country !== 'BR' && cep.length >= 3) {
                                calcularFrete(cep, country);
                            }
                        }}
                        style={{ flex: 1, minWidth: 0, margin: 0 }}
                    />
                </div>

                {(country === 'BR' ? cep.length === 8 : cep.length >= 3) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                        <input type="text" className="input-cliente" placeholder="Rua / Avenida" value={endereco.rua} onChange={e => setEndereco({...endereco, rua: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" className="input-cliente" placeholder="Número" value={endereco.numero} onChange={e => setEndereco({...endereco, numero: e.target.value})} style={{ width: '80px' }} required />
                            <input type="text" className="input-cliente" placeholder="Complemento" value={endereco.complemento} onChange={e => setEndereco({...endereco, complemento: e.target.value})} style={{ flex: 1 }} />
                        </div>
                        <input type="text" className="input-cliente" placeholder="Bairro" value={endereco.bairro} onChange={e => setEndereco({...endereco, bairro: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" className="input-cliente" placeholder="Cidade" value={endereco.cidade} onChange={e => setEndereco({...endereco, cidade: e.target.value})} style={{ flex: 2 }} readOnly={country === 'BR'} />
                            <input type="text" className="input-cliente" placeholder={country === 'BR' ? "UF" : "Estado"} value={endereco.estado} onChange={e => setEndereco({...endereco, estado: e.target.value})} style={{ flex: 1 }} readOnly={country === 'BR'} />
                        </div>
                        
                        <div style={{ marginTop: '10px' }}>
                            {loadingShipping ? (
                                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Calculando frete...</div>
                            ) : shippingOptions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#aaa' }}>Fretes disponíveis:</p>
                                    {shippingOptions.map((option) => {
                                        const priceValue = parseFloat(String(option.custom_price ?? option.price));
                                        const days = option.custom_delivery_time ?? option.delivery_time;
                                        return (
                                            <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#111', padding: '10px', borderRadius: '6px', cursor: 'pointer', border: selectedShipping?.id === option.id ? '1px solid var(--cor-destaque)' : '1px solid #333' }}>
                                                <input 
                                                    type="radio" 
                                                    name="shipping_option_modal" 
                                                    checked={selectedShipping?.id === option.id}
                                                    onChange={() => setSelectedShipping(option)}
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                    <div>
                                                        <strong style={{ color: 'white', fontSize: '0.9rem' }}>{option.name}</strong>
                                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Até {days} dias úteis</div>
                                                        {option.is_estimate && <div style={{ fontSize: '0.75rem', color: '#d6b36a' }}>Estimativa; confirmar no WhatsApp</div>}
                                                    </div>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--cor-destaque)', fontSize: '0.9rem' }}>
                                                        R$ {priceValue.toFixed(2).replace('.', ',')}
                                                    </div>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            ) : !loadingShipping && endereco.cidade ? (
                                <div style={{ color: '#ff4444', fontSize: '0.85rem' }}>Não foi possível calcular o frete online. O vendedor informará.</div>
                            ) : null}
                        </div>
                    </div>
                )}
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

            <button className="btn btn-finalizar" onClick={handleDirectPurchase} disabled={isCheckingOut} style={{ marginTop: '20px' }}>
                {isCheckingOut ? 'Validando pedido...' : 'Confirmar Pedido no WhatsApp'}
            </button>
            </div>
        </Modal>
    );
}
