import type { Metadata } from "next";
import { Roboto, Teko } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from '@/context/ToastContext';
import CampaignBannerServer from "@/components/CampaignBannerServer";
import CookieConsent from "@/components/CookieConsent";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  // Define a base para todas as URLs absolutas
  metadataBase: new URL('https://gringa-style.netlify.app'),

  // --- AQUI ESTÁ A CORREÇÃO ---
  // Isso diz ao Next.js: "Gere uma tag canonical para esta página usando a URL atual"
  // Como definimos o metadataBase acima, o './' resolve para a URL completa da página atual.
  alternates: {
    canonical: './',
  },
  // ---------------------------

  title: "Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG",
  description: "Encontre as melhores máscaras de solda personalizadas, automáticas e acessórios para TIG. Estilo e proteção para soldadores profissionais. Confira!",
  keywords: ["máscara de solda", "solda tig", "personalizada", "gringa style", "acessórios solda"],
  openGraph: {
    title: "Gringa Style | Máscaras de Solda Personalizadas",
    description: "Estilo e proteção para soldadores profissionais.",
    url: "https://gringa-style.netlify.app",
    siteName: "Gringa Style",
    images: [
      {
        url: "/imagens/logo_gringa_style.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* O Next.js injetará a tag canonical aqui automaticamente */}
      </head>
      <body
        className={`${roboto.variable} ${teko.variable} antialiased`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2L2F9CY9JN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2L2F9CY9JN');
          `}
        </Script><script src="https://analytics.ahrefs.com/analytics.js" data-key="Sam0BvC3Nm1qohD+XzVeLA" async></script>

        <ToastProvider>
          <Header />
          <CampaignBannerServer />
          {children}
          <CookieConsent />
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}