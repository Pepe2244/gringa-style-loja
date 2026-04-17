'use client';

import { useEffect } from 'react';

interface AnalyticsLoaderProps {
    ahrefsKey?: string;
}

export default function AnalyticsLoader({ ahrefsKey }: AnalyticsLoaderProps) {
    useEffect(() => {
        const handleConsent = () => {
            console.log('AnalyticsLoader: Consentimento concedido, carregando scripts...');

            // Carregar Ahrefs Analytics
            if (!document.querySelector('script[src*="analytics.ahrefs.com"]')) {
                const key = ahrefsKey || 'Sam0BvC3Nm1qohD+XzVeLA';
                const ahrefsScript = document.createElement('script');
                ahrefsScript.src = 'https://analytics.ahrefs.com/analytics.js';
                ahrefsScript.setAttribute('data-key', key);
                ahrefsScript.async = true;
                document.head.appendChild(ahrefsScript);
                console.log('AnalyticsLoader: Ahrefs Analytics carregado');
            }

            // Carregar Microsoft Clarity
            if (!document.querySelector('script[src*="clarity.ms"]')) {
                const clarityScript = document.createElement('script');
                clarityScript.innerHTML = `
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "vybz5xptlm");
                `;
                document.head.appendChild(clarityScript);
                console.log('AnalyticsLoader: Microsoft Clarity carregado');
            }

            // Nota: Google Analytics é carregado via GoogleAnalytics component no layout
            // quando hasConsent é true
        };

        window.addEventListener('cookieConsentGranted', handleConsent);

        return () => {
            window.removeEventListener('cookieConsentGranted', handleConsent);
        };
    }, [ahrefsKey]);

    return null;
}