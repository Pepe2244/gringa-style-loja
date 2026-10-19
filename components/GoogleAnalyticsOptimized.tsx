'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface Props {
  gaId: string;
}

export default function GoogleAnalyticsOptimized({ gaId }: Props) {
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('mark_feature_usage', {
        detail: { feature: 'next-third-parties-ga-optimized' },
      });
    }
  }, []);

  if (!gaId) return null;

  return (
    <>
      <Script
        id="_next-ga-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window['dataLayer'] = window['dataLayer'] || [];
            function gtag(){window['dataLayer'].push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
      <Script
        id="_next-ga"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
    </>
  );
}
