import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Gringa Style',
  description: 'A Gringa Style respeita a sua privacidade. Saiba como cuidamos e utilizamos seus dados ao realizar compras e participar de nossas rifas.',
  alternates: { canonical: buildCanonicalUrl('/privacidade') },
  openGraph: {
    title: 'Política de Privacidade | Gringa Style',
    description: 'A Gringa Style respeita a sua privacidade. Saiba como cuidamos e utilizamos seus dados.',
    url: buildCanonicalUrl('/privacidade'),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
