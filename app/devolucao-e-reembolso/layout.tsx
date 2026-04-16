import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Devolução e Reembolso | Gringa Style',
  description: 'Conheça nossos prazos e condições para trocas, devoluções e reembolsos na Gringa Style.',
  alternates: { canonical: '/devolucao-e-reembolso' },
  robots: 'index, follow',
};

export default function DevolucaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}