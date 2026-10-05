'use client';

import { useEffect, useState } from 'react';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('cookie-consent='))
            ?.split('=')[1];

        setShow(consent !== 'true' && consent !== 'false');
    }, []);

    const accept = () => {
        document.cookie = `cookie-consent=true; path=/; max-age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        setShow(false);
        window.dispatchEvent(new Event('cookieConsentGranted'));
    };

    const reject = () => {
        document.cookie = `cookie-consent=false; path=/; max-age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        setShow(false);
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(18, 18, 18, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '16px 20px',
            zIndex: 9999,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
            boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.3)'
        }}>
            <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', lineHeight: '1.4', flex: 1 }}>
                Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência. 
                Você pode aceitar todos ou rejeitar os não essenciais. 
                <a href="/privacidade" style={{ color: 'var(--cor-destaque)', textDecoration: 'underline', marginLeft: '5px' }}>Saiba mais</a>.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                    onClick={reject}
                    aria-label="Rejeitar cookies não essenciais"
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ccc',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Rejeitar
                </button>
                <button
                    onClick={accept}
                    aria-label="Aceitar todos os cookies"
                    style={{
                        background: 'var(--cor-destaque)',
                        color: 'black',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: '800',
                        cursor: 'pointer'
                    }}
                >
                    Aceitar Todos
                </button>
            </div>
        </div>
    );
}