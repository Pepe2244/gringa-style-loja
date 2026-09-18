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
            const { gaId, ahrefsKey, clarityId } = analyticsConfig;

            // Um único inicializador evita duplicar scripts ou pageviews.
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

            if (!document.querySelector('script[src*="analytics.ahrefs.com"]')) {
                const ahrefsScript = document.createElement('script');
                ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
                ahrefsScript.setAttribute('data-key', ahrefsKey);
                ahrefsScript.async = true;
                document.head.appendChild(ahrefsScript);
            }

            if (!document.querySelector(`script[src*="clarity.ms/tag/${clarityId}"]`)) {
                const clarityScript = document.createElement('script');
                clarityScript.src = `https://www.clarity.ms/tag/${clarityId}`;
                clarityScript.async = true;
                document.head.appendChild(clarityScript);
            }
        };

        if (hasConsent) loadAnalytics();

        const handleConsent = () => loadAnalytics();
        window.addEventListener('cookieConsentGranted', handleConsent);

        return () => {
            window.removeEventListener('cookieConsentGranted', handleConsent);
        };
    }, [hasConsent, analyticsConfig]);

    return null;
}