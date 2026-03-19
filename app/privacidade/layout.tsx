import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Gringa Style',
  description: 'A Gringa Style respeita a sua privacidade. Saiba como cuidamos e utilizamos seus dados ao realizar compras e participar de nossas rifas.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
