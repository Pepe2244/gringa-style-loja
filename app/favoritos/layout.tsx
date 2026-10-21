import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meus Favoritos | Gringa Style',
  robots: {
    index: false,
    follow: true,
  },
};

export default function FavoritosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
