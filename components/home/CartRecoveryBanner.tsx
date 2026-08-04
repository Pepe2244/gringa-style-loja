'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { trackEvent } from '@/utils/analytics';

interface CartRecoveryBannerProps {
context?: 'home' | 'product_page';
}

export default function CartRecoveryBanner({ context = 'home' }: CartRecoveryBannerProps) {
const pathname = usePathname();
const totalItems = useCartStore(state => state.totalItems());
const showBanner = useCartStore(state => state.showCartRecoveryBanner);
const dismissCartRecoveryBanner = useCartStore(state => state.dismissCartRecoveryBanner);
const [mounted, setMounted] = useState(false);

useEffect(() => {
    setMounted(true);
}, []);

useEffect(() => {
    // Se estiver na rota do carrinho, nao inicia o timer
    if (!mounted || !showBanner || totalItems === 0 || pathname === '/carrinho') return;

    const timeoutId = window.setTimeout(() => {
        dismissCartRecoveryBanner();
    }, 8000);

    return () => window.clearTimeout(timeoutId);
}, [dismissCartRecoveryBanner, mounted, showBanner, totalItems, pathname]);

// Oculta o popup completamente caso o usuario esteja na pagina /carrinho
if (!mounted || !showBanner || totalItems === 0 || pathname === '/carrinho') return null;

const handleContinue = () => {
    trackEvent('cart_recovery_click', {
        context,
        item_count: totalItems
    });
};

const handleDismiss = () => {
    dismissCartRecoveryBanner();
};

return (
    <section className="surface-card" style={{
        marginBottom: '24px',
        padding: '18px 20px',
        borderRadius: '16px',
        position: 'fixed',
        top: '104px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        width: 'min(92vw, 720px)',
        boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(16px)'
    }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Fechar aviso"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '999px',
                        border: '1px solid #444',
                        backgroundColor: 'transparent',
                        color: '#ccc',
                        cursor: 'pointer'
                    }}
                >
                    <X size={16} />
                </button>

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
                    Ir ao carrinho
                </Link>
            </div>
        </div>
    </section>
);


}