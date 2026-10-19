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

    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('mark_feature_usage', {
        detail: { feature: 'next-third-parties-ga-optimized' },
      });
    }

    const loadGTM = () => {
      if (window._gtmLoaded) return;
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

    // Fallback se não houver interação do usuário: carrega em período ocioso (idle)
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if ('requestIdleCallback' in window) {
      idleId = (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number })
        .requestIdleCallback(loadGTM, { timeout: 3500 });
    } else {
      timerId = setTimeout(loadGTM, 3500);
    }

    return () => {
      cleanupListeners();
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
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
