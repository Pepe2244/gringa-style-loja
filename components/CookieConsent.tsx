'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setShow(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#222',
            padding: '12px 20px',
            zIndex: 9999,
            borderTop: '1px solid #444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap', // Força a ficar na mesma linha
            gap: '15px'
        }}>
            <p style={{ 
                margin: 0, 
                color: '#ccc', 
                fontSize: '0.8rem', // Ligeiramente menor para caber bem no mobile
                lineHeight: '1.4',
                flex: 1 // Faz o texto ocupar o espaço restante e empurrar o botão
            }}>
                Utilizamos cookies para melhorar sua experiência e analisar o tráfego. Ao continuar, você concorda com nossa política de privacidade.
            </p>
            <button
                onClick={accept}
                aria-label="Aceitar cookies"
                style={{
                    background: 'var(--cor-destaque)',
                    color: 'black',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flexShrink: 0 // Impede que o botão diminua de tamanho em telas pequenas
                }}
            >
                Aceitar
            </button>
        </div>
    );
}


