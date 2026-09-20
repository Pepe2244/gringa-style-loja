import GrupoHubPage from '@/components/GrupoHubPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gringa Style | Loja e Soldas Especiais',
  description: 'Escolha entre a loja Gringa Style e as soluções em soldagem especial para sua empresa.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Gringa Style | Loja e Soldas Especiais',
    description: 'Produtos para soldadores e soluções técnicas para operações industriais.',
    url: 'https://gringastylebr.com.br',
    siteName: 'Gringa Style',
    images: [{ url: '/imagens/logo_gringa_style.png', width: 800, height: 600 }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gringa Style',
    description: 'Máscaras de solda personalizadas e acessórios para TIG.',
    images: ['/imagens/logo_gringa_style.png'],
  },
};

export default async function Home() {
  return <GrupoHubPage />;
}