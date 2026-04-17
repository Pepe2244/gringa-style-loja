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
        // Dispara evento para carregar scripts de analytics
        window.dispatchEvent(new Event('cookieConsentGranted'));
    };

    const reject = () => {
        // Grava cookie de rejeição por 1 ano
        document.cookie = "cookie-consent=false; path=/; max-age=31536000";
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
            flexWrap: 'wrap',
            gap: '15px'
        }}>
            <p style={{ margin: 0, color: '#ccc', fontSize: '0.8rem', lineHeight: '1.4', flex: 1 }}>
                Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência. 
                Você pode aceitar todos ou rejeitar os não essenciais. 
                <a href="/privacidade" style={{ color: 'var(--cor-destaque)', textDecoration: 'underline' }}>Saiba mais</a>.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                    onClick={reject}
                    aria-label="Rejeitar cookies não essenciais"
                    style={{
                        background: '#555',
                        color: '#ccc',
                        border: '1px solid #777',
                        padding: '8px 16px',
                        borderRadius: '5px',
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
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Aceitar Todos
                </button>
            </div>
        </div>
    );
}


