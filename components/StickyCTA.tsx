'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';

export default function StickyCTA({ product }: { product: Product }) {
    const [isVisible, setIsVisible] = useState(false);

    const handleBuy = () => {
        const buyBtn = document.querySelector('.btn-adicionar') as HTMLElement;
        if (buyBtn) {
            buyBtn.click();
        } else {
            // Fallback if button not found (e.g. scroll to top)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const buyButton = document.querySelector('.btn-adicionar');
            if (buyButton) {
                const rect = buyButton.getBoundingClientRect();
                // Show if button is above the viewport (scrolled past)
                setIsVisible(rect.bottom < 0);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isVisible || !product.em_estoque) return null;

    return (
        <div className="sticky-cta">
            <div className="sticky-cta-info">
                <span className="sticky-cta-name">{product.nome}</span>
                <span className="sticky-cta-price">
                    R$ {(product.preco_promocional || product.preco).toFixed(2).replace('.', ',')}
                </span>
            </div>
            <button onClick={handleBuy} className="btn-sticky-buy">
                Comprar
            </button>
            <style jsx>{`
                .sticky-cta {
                    position: fixed;
                    bottom: 12px;
                    left: 12px;
                    right: 12px;
                    background: rgba(17, 17, 17, 0.78);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 16px;
                    padding: 12px 14px;
                    display: flex;
                    justifyContent: space-between;
                    alignItems: center;
                    z-index: 1000;
                    box-shadow: 0 16px 35px rgba(0,0,0,0.28);
                    animation: slideUp 0.3s ease-out;
                }
                .sticky-cta-info {
                    display: flex;
                    flex-direction: column;
                }
                .sticky-cta-name {
                    font-weight: bold;
                    color: white;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 200px;
                }
                .sticky-cta-price {
                    color: var(--cor-destaque);
                    font-size: 1rem;
                }
                .btn-sticky-buy {
                    background: linear-gradient(135deg, rgba(255,165,0,0.95), rgba(255,140,0,0.9));
                    margin-left: auto;
                    color: #111;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 999px;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(255,165,0,0.18);
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @media (min-width: 768px) {
                    .sticky-cta {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
