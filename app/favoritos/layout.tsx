import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Meus Favoritos | Gringa Style',
  description: 'Confira sua lista de produtos favoritos e equipamentos de solda salvos na Gringa Style.',
  alternates: { canonical: buildCanonicalUrl('/favoritos') },
  robots: {
    index: false,
    follow: true,
  },
};

export default function FavoritosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
