'use client';

import { Ticket, Heart, Eye, Share2 } from 'lucide-react';

interface PaymentMethodsProps {
    showLabel?: boolean;
    compact?: boolean;
}

export default function PaymentMethods({ showLabel = true, compact = false }: PaymentMethodsProps) {
    const methods = [
        { name: 'PIX', icon: '📱', color: '#3498db' },
        { name: 'Cartão', icon: '💳', color: '#2ecc71' },
        { name: 'Boleto', icon: '📄', color: '#e74c3c' }
    ];

    return (
        <div
            className="payment-methods"
            style={{
                display: 'flex',
                gap: compact ? '8px' : '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                padding: compact ? '0' : '12px 0'
            }}
        >
            {showLabel && (
                <span style={{
                    fontSize: compact ? '0.75rem' : '0.85rem',
                    color: '#888',
                    fontWeight: 500,
                    marginRight: compact ? '4px' : '8px'
                }}>
                    Pagamento:
                </span>
            )}
            {methods.map(method => (
                <div
                    key={method.name}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: compact ? '4px 8px' : '6px 12px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        fontSize: compact ? '0.75rem' : '0.85rem',
                        color: '#ddd'
                    }}
                    title={method.name}
                >
                    <span style={{ fontSize: compact ? '1rem' : '1.2rem' }}>{method.icon}</span>
                    {!compact && method.name}
                </div>
            ))}
        </div>
    );
}

export function TrustBadges() {
    const badges = [
        { icon: '🔒', text: 'Compra Segura', title: 'Dados criptografados' },
        { icon: '📦', text: '7-14 dias úteis', title: 'Prazo de entrega' },
        { icon: '↩️', text: '30 dias', title: 'Devolução garantida' },
        { icon: '💬', text: 'Suporte WhatsApp', title: 'Chat em tempo real' }
    ];

    return (
        <div
            className="trust-badges"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '15px',
                padding: '20px 0',
                marginTop: '20px'
            }}
        >
            {badges.map((badge, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '15px',
                        backgroundColor: '#111',
                        borderRadius: '8px',
                        border: '1px solid #222',
                        textAlign: 'center'
                    }}
                    title={badge.title}
                >
                    <span style={{ fontSize: '1.8rem' }}>{badge.icon}</span>
                    <span style={{ fontSize: '0.85rem', color: '#ddd', fontWeight: 500 }}>
                        {badge.text}
                    </span>
                </div>
            ))}
        </div>
    );
}
