import type { Metadata } from "next";
import { Roboto, Teko } from "next/font/google";
import "./globals.css";
import Script from "next/script";

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

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { ToastProvider } from '@/context/ToastContext';

import CampaignBanner from "@/components/CampaignBanner";
import CookieConsent from "@/components/CookieConsent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>

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
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2L2F9CY9JN');
          `}
        </Script>
        <ToastProvider>
          <Header />
          <CampaignBanner />
          {children}
          <CookieConsent />
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
