import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
    title: 'Acompanhar Meus Números | Rifa Gringa Style',
    description: 'Consulte o status dos seus números reservados e pagos nas ações e rifas oficiais da Gringa Style.',
    alternates: {
        canonical: buildCanonicalUrl('/acompanhar-rifa'),
    },
};

export default function AcompanharRifaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
