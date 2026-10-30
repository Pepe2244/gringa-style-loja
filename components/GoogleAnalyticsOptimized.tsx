'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface Props {
  gaId: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    _gtmLoaded?: boolean;
  }
}

export default function GoogleAnalyticsOptimized({ gaId }: Props) {
  useEffect(() => {
    if (!gaId || typeof window === 'undefined' || window._gtmLoaded) return;

    const getConsentCookie = () => {
      try {
        const fromCookie = document.cookie
          .split('; ')
          .find((cookie) => cookie.startsWith('cookie-consent='))
          ?.split('=')[1];
        if (fromCookie) return fromCookie;
        return localStorage.getItem('cookie-consent');
      } catch {
        return null;
      }
    };

    const loadGTM = () => {
      if (window._gtmLoaded) return;
      if (getConsentCookie() === 'false') return;
      window._gtmLoaded = true;

      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);
    };

    const onUserInteraction = () => {
      loadGTM();
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('mousemove', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
    };

    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });
    window.addEventListener('mousemove', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true, once: true });
    window.addEventListener('click', onUserInteraction, { passive: true, once: true });

    // Fallback por timer para usuários que não interagirem imediatamente
    const timerId = setTimeout(loadGTM, 8500);

    return () => {
      cleanupListeners();
      clearTimeout(timerId);
    };
  }, [gaId]);

  if (!gaId) return null;

  return (
    <Script
      id="_next-ga-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window['dataLayer'] = window['dataLayer'] || [];
          function gtag(){window['dataLayer'].push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { page_path: window.location.pathname });
        `,
      }}
    />
  );
}
