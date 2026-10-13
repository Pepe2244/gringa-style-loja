import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Histórico de Rifas e Sorteios | Gringa Style',
  description: 'Confira o histórico completo das rifas realizadas pela Gringa Style. Veja os vencedores e prêmios sorteados.',
  alternates: { canonical: buildCanonicalUrl('/historico') },
};

export default function HistoricoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
