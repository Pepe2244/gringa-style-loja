'use client';

import { useEffect } from 'react';

interface AnalyticsLoaderProps {
    ahrefsKey?: string;
}

export default function AnalyticsLoader({ ahrefsKey }: AnalyticsLoaderProps) {
    useEffect(() => {
        const handleConsent = () => {
            // Carregar Ahrefs Analytics via script externo
            if (!document.querySelector('script[src*="analytics.ahrefs.com"]')) {
                const key = ahrefsKey || 'Sam0BvC3Nm1qohD+XzVeLA';
                const ahrefsScript = document.createElement('script');
                ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
                ahrefsScript.setAttribute('data-key', key);
                ahrefsScript.async = true;
                document.head.appendChild(ahrefsScript);
            }

            // Carregar Microsoft Clarity via tag externa
            const clarityId = 'vybz5xptlm';
            if (!document.querySelector(`script[src*="clarity.ms/tag/${clarityId}"]`)) {
                const clarityScript = document.createElement('script');
                clarityScript.src = `https://www.clarity.ms/tag/${clarityId}`;
                clarityScript.async = true;
                document.head.appendChild(clarityScript);
            }
        };

        window.addEventListener('cookieConsentGranted', handleConsent);

        return () => {
            window.removeEventListener('cookieConsentGranted', handleConsent);
        };
    }, [ahrefsKey]);

    return null;
}