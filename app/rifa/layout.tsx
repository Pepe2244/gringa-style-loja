import type { Metadata } from 'next';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
    title: { absolute: 'Ação Entre Amigos / Rifa de Solda | Gringa Style' },
    description: 'Participe da nossa ação entre amigos e concorra a máscaras de solda personalizadas, tochas TIG e equipamentos exclusivos.',
    alternates: {
        canonical: buildCanonicalUrl('/rifa'),
    },
    openGraph: {
        title: 'Ação Entre Amigos / Rifa de Solda | Gringa Style',
        description: 'Concorra a máscaras de solda exclusivas e prêmios profissionais.',
        url: buildCanonicalUrl('/rifa'),
        siteName: 'Gringa Style',
        locale: 'pt_BR',
        type: 'website',
        images: [
            {
                url: `${siteConfig.appUrl}/imagens/logo_gringa_style.png`,
                width: 800,
                height: 600,
                alt: 'Rifa Gringa Style',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Ação Entre Amigos / Rifa de Solda | Gringa Style',
        description: 'Concorra a máscaras de solda exclusivas e prêmios profissionais.',
        images: [`${siteConfig.appUrl}/imagens/logo_gringa_style.png`],
    },
};

export default function RifaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
