import type { Metadata } from 'next';
import GSServicosIndustriaisPage from '@/components/SoldasEspeciaisPage';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: {
    absolute: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
  },
  description: 'Soluções industriais em soldas especiais e mecânica industrial, da manutenção à recuperação de equipamentos e componentes.',
  alternates: { canonical: buildCanonicalUrl('/gs-servicos-industriais') },
  openGraph: {
    title: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
    description: 'Serviços industriais especializados em soldagem, manutenção mecânica e recuperação de equipamentos.',
    url: buildCanonicalUrl('/gs-servicos-industriais'),
    siteName: 'GS Serviços Industriais',
    images: [{ url: new URL('/imagens/unnamed.png', siteConfig.appUrl).toString(), width: 1920, height: 1920, alt: 'Logo GS Serviços Industriais' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
    description: 'Serviços industriais especializados em soldagem, manutenção mecânica.',
    images: [new URL('/imagens/unnamed.png', siteConfig.appUrl).toString()],
  },
};

export default function GSServicosIndustriaisRoute() {
  return <GSServicosIndustriaisPage />;
}
