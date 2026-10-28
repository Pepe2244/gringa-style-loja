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

        // Carrega imediatamente se já aceitou, ou na primeira interação do usuário (igual ao GA4)
        const consent = getConsentCookie();
        if (consent === 'true') {
            loadAnalytics();
        } else if (consent !== 'false') {
            const onFirstInteraction = () => {
                loadAnalytics();
                cleanupInteractionListeners();
            };

                const cleanupInteractionListeners = () => {
                    window.removeEventListener('scroll', onFirstInteraction);
                    window.removeEventListener('mousemove', onFirstInteraction);
                    window.removeEventListener('touchstart', onFirstInteraction);
                    window.removeEventListener('click', onFirstInteraction);
                };

                window.addEventListener('scroll', onFirstInteraction, { passive: true, once: true });
                window.addEventListener('mousemove', onFirstInteraction, { passive: true, once: true });
                window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
                window.addEventListener('click', onFirstInteraction, { passive: true, once: true });

                const fallbackTimer = setTimeout(loadAnalytics, 4000);

                const handleConsent = () => {
                    loadAnalytics();
                    if (typeof window.clarity === 'function') {
                        window.clarity('consent');
                    }
                };
                window.addEventListener('cookieConsentGranted', handleConsent);

                return () => {
                    cleanupInteractionListeners();
                    clearTimeout(fallbackTimer);
                    window.removeEventListener('cookieConsentGranted', handleConsent);
                };
            }

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
        }, [analyticsConfig]);

    return null;
}
