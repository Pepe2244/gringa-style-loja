import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Seu Carrinho | Finalize sua compra na Gringa Style',
  description: 'Revise seus itens, aplique cupons de desconto e finalize sua compra com segurança na Gringa Style via PIX ou Cartão de Crédito.',
  alternates: { canonical: buildCanonicalUrl('/carrinho') },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
