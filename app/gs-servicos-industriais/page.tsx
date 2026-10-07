import type { Metadata } from 'next';
import GSServicosIndustriaisPage from '@/components/SoldasEspeciaisPage';

export const metadata: Metadata = {
  title: 'GS Serviços Industriais | Soldas Especiais e Mecânica Industrial',
  description: 'Soluções industriais em soldas especiais e mecânica industrial, da manutenção à recuperação de equipamentos e componentes.',
  alternates: { canonical: '/gs-servicos-industriais' },
};

export default function GSServicosIndustriaisRoute() {
  return <GSServicosIndustriaisPage />;
}
