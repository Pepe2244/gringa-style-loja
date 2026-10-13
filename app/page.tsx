import GrupoHubPage from '@/components/GrupoHubPage';
import type { Metadata } from 'next';
import { siteConfig, buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Gringa Style | Máscaras de Solda Personalizadas, EPIs e Acessórios TIG',
  description: 'Máscaras de solda personalizadas em fibra de vidro, EPIs e acessórios para soldagem TIG/MIG. Pronta entrega para todo o Brasil, PIX e até 12x sem juros.',
  alternates: { canonical: buildCanonicalUrl('/') },
  keywords: [
    'máscara de solda personalizada',
    'máscara de solda tig',
    'epi soldador',
    'fibra de vidro',
    'solda mig',
    'gringa style',
    'acessórios de solda',
    'boné soldador',
    'botina soldador',
  ],
  openGraph: {
    title: 'Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG',
    description: 'Máscaras de solda personalizadas, EPIs e acessórios para soldagem TIG/MIG. Pronta entrega para todo o Brasil.',
    url: siteConfig.appUrl,
    siteName: 'Gringa Style',
    images: [{ url: new URL('/imagens/logo_gringa_style.png', siteConfig.appUrl).toString(), width: 800, height: 600 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gringa Style',
    description: 'Máscaras de solda personalizadas e acessórios para TIG.',
    images: [new URL('/imagens/logo_gringa_style.png', siteConfig.appUrl).toString()],
  },
};

export default async function Home() {
  return <GrupoHubPage />;
}