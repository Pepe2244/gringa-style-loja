import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rifa Gringa Style | Concorra a Equipamentos de Solda Profissionais',
  description: 'Participe da Rifa Gringa Style e concorra a prêmios incríveis como máscaras de solda automáticas, lentes personalizadas e acessórios TIG originais.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
