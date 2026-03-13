'use client';

import { useState } from 'react';

export default function CookieConsent() {
    // Se o componente foi chamado, é porque o servidor não achou o cookie.
    // Ele já nasce true, sem delay de hidratação.
    const [show, setShow] = useState(true);

    const accept = () => {
        // Grava o cookie nativo válido por 1 ano (31536000 segundos)
        document.cookie = "cookie-consent=true; path=/; max-age=31536000";
        // Oculta visualmente sem reload
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
            flexWrap: 'nowrap',
            gap: '15px'
        }}>
            <p style={{ margin: 0, color: '#ccc', fontSize: '0.8rem', lineHeight: '1.4', flex: 1 }}>
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
                    flexShrink: 0
                }}
            >
                Aceitar
            </button>
        </div>
    );
}


