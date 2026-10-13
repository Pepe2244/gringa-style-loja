import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Busca de Produtos | Gringa Style',
  description: 'Pesquise máscaras de solda, tochas, consumíveis e EPIs na Gringa Style.',
  alternates: { canonical: buildCanonicalUrl('/busca') },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
