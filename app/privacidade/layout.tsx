import type { Metadata } from 'next';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Gringa Style',
  description: 'A Gringa Style respeita a sua privacidade. Saiba como cuidamos e utilizamos seus dados ao realizar compras e participar de nossas rifas.',
  alternates: { canonical: buildCanonicalUrl('/privacidade') },
  openGraph: {
    title: 'Política de Privacidade | Gringa Style',
    description: 'A Gringa Style respeita a sua privacidade. Saiba como cuidamos e utilizamos seus dados.',
    url: buildCanonicalUrl('/privacidade'),
    siteName: 'Gringa Style',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: `${siteConfig.appUrl}/imagens/logo_gringa_style.png`,
        width: 800,
        height: 600,
        alt: 'Política de Privacidade Gringa Style',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidade | Gringa Style',
    description: 'A Gringa Style respeita a sua privacidade.',
    images: [`${siteConfig.appUrl}/imagens/logo_gringa_style.png`],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
