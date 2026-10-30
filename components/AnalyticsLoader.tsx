'use client';

import { useEffect } from 'react';
import { getAnalyticsConfig } from '@/lib/site-config';

declare global {
    interface Window {
        clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    }
}

export default function AnalyticsLoader() {
    const analyticsConfig = getAnalyticsConfig();

    useEffect(() => {
        const getConsentCookie = () =>
            document.cookie
                .split('; ')
                .find((cookie) => cookie.startsWith('cookie-consent='))
                ?.split('=')[1];

        const loadAnalytics = () => {
            const consent = getConsentCookie();
            // Respeita caso o usuário tenha rejeitado explicitamente os cookies analíticos
            if (consent === 'false') return;

            const { ahrefsKey, clarityId } = analyticsConfig;

            if (ahrefsKey && !document.querySelector('script[src*="analytics.ahrefs.com"]')) {
                const ahrefsScript = document.createElement('script');
                ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
                ahrefsScript.setAttribute('data-key', ahrefsKey);
                ahrefsScript.async = true;
                document.head.appendChild(ahrefsScript);
            }

            if (clarityId && !document.querySelector(`script[src*="clarity.ms/tag/${clarityId}"]`)) {
                // Obrigatório pelo Microsoft Clarity: inicializar a função global window.clarity e a fila .q
                // antes de injetar o script /tag/{clarityId}, caso contrário o script do Clarity aborta com TypeError.
                window.clarity =
                    window.clarity ||
                    function (...args: unknown[]) {
                        (window.clarity!.q = window.clarity!.q || []).push(args);
                    };

                const clarityScript = document.createElement('script');
                clarityScript.src = `https://www.clarity.ms/tag/${clarityId}`;
                clarityScript.async = true;
                document.head.appendChild(clarityScript);
            }

            if (consent === 'true' && typeof window.clarity === 'function') {
                window.clarity('consent');
            }
        };

        // Carrega imediatamente se o usuário já aceitou cookies anteriormente
        const consent = getConsentCookie();
        if (consent === 'true') {
            loadAnalytics();
        } else {
            // Aguarda consentimento explícito do usuário (LGPD/GDPR)
            const handleConsent = () => {
                loadAnalytics();
                if (typeof window.clarity === 'function') {
                    window.clarity('consent');
                }
            };
            window.addEventListener('cookieConsentGranted', handleConsent);

            return () => {
                window.removeEventListener('cookieConsentGranted', handleConsent);
            };
        }
    }, [analyticsConfig]);

    return null;
}
