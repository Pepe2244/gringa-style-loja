'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { trackEvent } from '@/utils/analytics';

interface CartRecoveryBannerProps {
    context?: 'home' | 'product_page';
}

export default function CartRecoveryBanner({ context = 'home' }: CartRecoveryBannerProps) {
    const totalItems = useCartStore(state => state.totalItems());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || totalItems === 0) return null;

    const handleContinue = () => {
        trackEvent('cart_recovery_click', {
            context,
            item_count: totalItems
        });
    };

    return (
        <section className="surface-card" style={{ marginBottom: '24px', padding: '18px 20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255, 107, 0, 0.15)' }}>
                        <ShoppingCart size={18} color="var(--cor-destaque)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Você ainda tem itens no carrinho</h3>
                        <p style={{ margin: '4px 0 0', color: '#ccc', fontSize: '0.95rem' }}>
                            {totalItems} {totalItems > 1 ? 'itens' : 'item'} aguardando sua decisão.
                        </p>
                    </div>
                </div>

                <Link
                    href="/carrinho"
                    onClick={handleContinue}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 16px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--cor-destaque)',
                        color: '#000',
                        textDecoration: 'none',
                        fontWeight: 800
                    }}
                >
                    Continuar compra
                </Link>
            </div>
        </section>
    );
}
