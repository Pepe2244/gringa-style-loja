'use client';

import { useEffect } from 'react';
import { getAnalyticsConfig } from '@/lib/site-config';

interface AnalyticsLoaderProps {
    hasConsent: boolean;
}

export default function AnalyticsLoader({ hasConsent }: AnalyticsLoaderProps) {
    const analyticsConfig = getAnalyticsConfig();

    useEffect(() => {
        const loadAnalytics = () => {
            const { gaId: configGaId, ahrefsKey, clarityId } = analyticsConfig;
            
            // Prioriza o novo ID informado ou usa o das configurações
            const gaId = 'G-8YVY9NP9VR';

            // 1. GOOGLE ANALYTICS (G-8YVY9NP9VR)
            if (gaId && !document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)) {
                const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer || [];
                (window as Window & { dataLayer?: unknown[] }).dataLayer = dataLayer;
                
                const gtag = (...args: unknown[]) => dataLayer.push(args);
                (window as Window & { gtag?: (...args: unknown[]) => void }).gtag = gtag;
                
                gtag('js', new Date());
                gtag('config', gaId);

                const gaScript = document.createElement('script');
                gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
                gaScript.async = true;
                document.head.appendChild(gaScript);
            }

            // 2. AHREFS ANALYTICS
            if (ahrefsKey && !document.querySelector('script[src*="analytics.ahrefs.com"]')) {
                const ahrefsScript = document.createElement('script');
                ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
                ahrefsScript.setAttribute('data-key', ahrefsKey);
                ahrefsScript.async = true;
                document.head.appendChild(ahrefsScript);
            }

            // 3. MICROSOFT CLARITY
            if (clarityId && !document.querySelector(`script[src*="clarity.ms/tag/${clarityId}"]`)) {
                const clarityScript = document.createElement('script');
                clarityScript.src = `https://www.clarity.ms/tag/${clarityId}`;
                clarityScript.async = true;
                document.head.appendChild(clarityScript);
            }
        };

        // Carrega se já houver consentimento via cookie no carregamento inicial
        if (hasConsent) {
            loadAnalytics();
        }

        // Carrega no momento em que o usuário clica em aceitar no banner
        const handleConsent = () => loadAnalytics();
        window.addEventListener('cookieConsentGranted', handleConsent);

        return () => {
            window.removeEventListener('cookieConsentGranted', handleConsent);
        };
    }, [hasConsent, analyticsConfig]);

    return null;
}