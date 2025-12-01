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
        // Trigger GA load if needed, or rely on next page load
        window.location.reload();
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#222',
            padding: '20px',
            zIndex: 9999,
            borderTop: '1px solid #444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
        }}>
            <p style={{ margin: 0, color: '#ccc', fontSize: '0.9rem' }}>
                Utilizamos cookies para melhorar sua experiência e analisar o tráfego. Ao continuar, você concorda com nossa política de privacidade.
            </p>
            <button
                onClick={accept}
                style={{
                    background: 'var(--cor-destaque)',
                    color: 'black',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            >
                Aceitar
            </button>
        </div>
    );
}
