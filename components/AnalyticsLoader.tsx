'use client';

import { useEffect } from 'react';
import { getAnalyticsConfig } from '@/lib/site-config';

export default function AnalyticsLoader() {
    const analyticsConfig = getAnalyticsConfig();

    useEffect(() => {
        const loadAnalytics = () => {
            const { ahrefsKey, clarityId } = analyticsConfig;

            if (ahrefsKey && !document.querySelector('script[src*="analytics.ahrefs.com"]')) {
                const ahrefsScript = document.createElement('script');
                ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
                ahrefsScript.setAttribute('data-key', ahrefsKey);
                ahrefsScript.async = true;
                document.head.appendChild(ahrefsScript);
            }

            if (clarityId && !document.querySelector(`script[src*="clarity.ms/tag/${clarityId}"]`)) {
                const clarityScript = document.createElement('script');
                clarityScript.src = `https://www.clarity.ms/tag/${clarityId}`;
                clarityScript.async = true;
                document.head.appendChild(clarityScript);
            }
        };

        const hasConsent = document.cookie
            .split('; ')
            .some((cookie) => cookie === 'cookie-consent=true');

        if (hasConsent) {
            loadAnalytics();
        }

        const handleConsent = () => loadAnalytics();
        window.addEventListener('cookieConsentGranted', handleConsent);

        return () => {
            window.removeEventListener('cookieConsentGranted', handleConsent);
        };
    }, [analyticsConfig]);

    return null;
}