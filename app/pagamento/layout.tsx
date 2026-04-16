export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Finalizar Compra | Gringa Style',
  description: 'Complete sua compra com segurança na Gringa Style. Pagamento via PIX ou cartão de crédito.',
  robots: 'noindex, nofollow',
};
export default function PagamentoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
