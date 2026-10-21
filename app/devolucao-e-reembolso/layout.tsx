import type { Metadata } from 'next';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
    title: { absolute: 'Política de Trocas e Devoluções | Gringa Style' },
    description: 'Conheça nossa política de trocas, devoluções e direito de arrependimento. Transparência e respeito ao Código de Defesa do Consumidor.',
    alternates: {
        canonical: buildCanonicalUrl('/devolucao-e-reembolso'),
    },
    openGraph: {
        title: 'Política de Trocas e Devoluções | Gringa Style',
        description: 'Conheça nossa política de trocas, devoluções e direito de arrependimento.',
        url: buildCanonicalUrl('/devolucao-e-reembolso'),
        siteName: 'Gringa Style',
        locale: 'pt_BR',
        type: 'website',
        images: [
            {
                url: `${siteConfig.appUrl}/imagens/logo_gringa_style.png`,
                width: 800,
                height: 600,
                alt: 'Política de Trocas e Devoluções Gringa Style',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Política de Trocas e Devoluções | Gringa Style',
        description: 'Conheça nossa política de trocas, devoluções e direito de arrependimento.',
        images: [`${siteConfig.appUrl}/imagens/logo_gringa_style.png`],
    },
};

export default function DevolucaoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}