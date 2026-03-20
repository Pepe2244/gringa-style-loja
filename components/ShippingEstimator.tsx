'use client';

import React, { useState } from 'react';
import { useToast } from '@/context/ToastContext';

interface ShippingOption {
    id: number;
    name: string;
    price: string | number;
    custom_price?: string | number;
    custom_delivery_time?: number;
    delivery_time: number;
}

export default function ShippingEstimator() {
    const { showToast } = useToast();
    const [cep, setCep] = useState('');
    const [country, setCountry] = useState('BR');
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<ShippingOption[]>([]);
    const [searched, setSearched] = useState(false);

    const handleCalculate = async () => {
        const cleanCep = country === 'BR' ? cep.replace(/\D/g, '') : cep.trim();
        if (country === 'BR' && cleanCep.length !== 8) {
            showToast('Digite um CEP válido com 8 dígitos.', 'error');
            return;
        }
        if (country !== 'BR' && cleanCep.length < 3) {
            showToast('Digite um código postal válido.', 'error');
            return;
        }

        setLoading(true);
        setSearched(true);
        setOptions([]);

        try {
            const res = await fetch('/api/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to_postal_code: cleanCep, country })
            });

            const data = await res.json();
            
            if (Array.isArray(data) && data.length > 0) {
                setOptions(data);
            } else {
                showToast('Não foi possível calcular o frete para este CEP.', 'error');
            }
        } catch (error) {
            console.error('Erro ao calcular frete:', error);
            showToast('Erro interno ao buscar opções de frete.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                Calcular Frete e Prazo
            </h3>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <select
                    value={country}
                    onChange={(e) => {
                        setCountry(e.target.value);
                        setCep('');
                        setOptions([]);
                        setSearched(false);
                    }}
                    style={{ flex: '0 0 auto', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: 'white', fontSize: '0.95rem' }}
                >
                    <option value="BR">Brasil</option>
                    <option value="US">USA</option>
                    <option value="PT">Portugal</option>
                    <option value="INT">Outro País</option>
                </select>
                <input
                    type="text"
                    placeholder={country === 'BR' ? "Seu CEP" : "Postal Code"}
                    value={cep}
                    maxLength={country === 'BR' ? 9 : 20}
                    onChange={(e) => {
                        if (country === 'BR') {
                            let v = e.target.value.replace(/\D/g, '');
                            if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8);
                            setCep(v);
                        } else {
                            setCep(e.target.value);
                        }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCalculate(); }}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: 'white', fontSize: '0.95rem' }}
                />
                <button
                    onClick={handleCalculate}
                    disabled={loading || (country === 'BR' ? cep.replace(/\D/g, '').length !== 8 : cep.trim().length < 3)}
                    style={{ padding: '0 20px', background: 'var(--cor-destaque)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? '...' : 'OK'}
                </button>
            </div>

            {searched && !loading && options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((opt) => {
                        const price = parseFloat(String(opt.custom_price || opt.price));
                        const days = opt.custom_delivery_time || opt.delivery_time;
                        return (
                            <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px 12px', borderRadius: '6px', border: '1px solid #333' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#eee' }}>{opt.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>Entrega em até {days} dias úteis</span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'var(--cor-destaque)', fontSize: '0.95rem' }}>
                                    R$ {price.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
