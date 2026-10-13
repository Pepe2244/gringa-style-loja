import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
    title: 'Política de Trocas e Devoluções | Gringa Style',
    description: 'Conheça nossa política de trocas, devoluções e direito de arrependimento. Transparência e respeito ao Código de Defesa do Consumidor.',
    alternates: {
        canonical: buildCanonicalUrl('/devolucao-e-reembolso'),
    },
    openGraph: {
        title: 'Política de Trocas e Devoluções | Gringa Style',
        description: 'Conheça nossa política de trocas, devoluções e direito de arrependimento.',
        url: buildCanonicalUrl('/devolucao-e-reembolso'),
    },
};

export default function DevolucaoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}