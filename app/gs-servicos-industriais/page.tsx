import type { Metadata } from 'next';
import GSServicosIndustriaisPage from '@/components/SoldasEspeciaisPage';

export const metadata: Metadata = {
  title: {
    absolute: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
  },
  description: 'Soluções industriais em soldas especiais e mecânica industrial, da manutenção à recuperação de equipamentos e componentes.',
  alternates: { canonical: '/gs-servicos-industriais' },
  openGraph: {
    title: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
    description: 'Serviços industriais especializados em soldagem, manutenção mecânica e recuperação de equipamentos.',
    url: 'https://gringastylebr.com.br/gs-servicos-industriais',
    siteName: 'GS Serviços Industriais',
    images: [{ url: '/imagens/logo_gringa_style.png', width: 800, height: 600, alt: 'GS Serviços Industriais' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
    description: 'Serviços industriais especializados em soldagem, manutenção mecânica e recuperação de equipamentos.',
    images: ['/imagens/logo_gringa_style.png'],
  },
};

export default function GSServicosIndustriaisRoute() {
  return <GSServicosIndustriaisPage />;
}
