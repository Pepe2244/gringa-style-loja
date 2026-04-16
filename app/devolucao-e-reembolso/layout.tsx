import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Devolução e Reembolso | Gringa Style',
  description: 'Conheça nossos prazos e condições para trocas, devoluções e reembolsos na Gringa Style.',
  robots: 'noindex, follow', // Merchant Center precisa ler, mas você pode optar por não rankear tanto em buscas orgânicas gerais se preferir
};

export default function DevolucaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}