import type { Metadata } from 'next';
import SoldasEspeciaisPage from '@/components/SoldasEspeciaisPage';

export const metadata: Metadata = {
  title: 'Soldas Especiais B2B',
  description: 'Recuperação de ativos críticos, soldagem industrial e soluções técnicas para indústria.',
  alternates: { canonical: '/soldas-especiais' },
};

export default function SoldasEspeciaisRoute() {
  return <SoldasEspeciaisPage />;
}
