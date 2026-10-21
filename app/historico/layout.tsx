import type { Metadata } from 'next';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: 'Histórico de Rifas e Sorteios | Gringa Style' },
  description: 'Confira o histórico completo das rifas realizadas pela Gringa Style. Veja os vencedores e prêmios sorteados.',
  alternates: { canonical: buildCanonicalUrl('/historico') },
  openGraph: {
    title: 'Histórico de Rifas e Sorteios | Gringa Style',
    description: 'Confira o histórico completo das rifas realizadas pela Gringa Style. Veja os vencedores e prêmios sorteados.',
    url: buildCanonicalUrl('/historico'),
    siteName: 'Gringa Style',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: `${siteConfig.appUrl}/imagens/logo_gringa_style.png`,
        width: 800,
        height: 600,
        alt: 'Histórico de Rifas e Sorteios Gringa Style',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Histórico de Rifas e Sorteios | Gringa Style',
    description: 'Confira o histórico completo das rifas realizadas pela Gringa Style.',
    images: [`${siteConfig.appUrl}/imagens/logo_gringa_style.png`],
  },
};

export default function HistoricoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
