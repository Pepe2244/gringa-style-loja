import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/site-config';

export const metadata: Metadata = {
    title: 'Ação Entre Amigos / Rifa de Solda | Gringa Style',
    description: 'Participe da nossa ação entre amigos e concorra a máscaras de solda personalizadas, tochas TIG e equipamentos exclusivos.',
    alternates: {
        canonical: buildCanonicalUrl('/rifa'),
    },
    openGraph: {
        title: 'Ação Entre Amigos / Rifa de Solda | Gringa Style',
        description: 'Concorra a máscaras de solda exclusivas e prêmios profissionais.',
        url: buildCanonicalUrl('/rifa'),
    },
};

export default function RifaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
