import type { Metadata } from "next";
import { Roboto, Teko } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';
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
  // Estrategista avisa: Continuas com o subdomínio da Netlify. 
  // Estás a perder conversão por falta de confiança no domínio. Muda isto assim que possível.
  metadataBase: new URL('https://gringa-style.netlify.app'),
  alternates: {
    canonical: './',
  },
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
        <link rel="preconnect" href="https://lijsjlkgydlszdhmsppt.supabase.co" />
        <link rel="dns-prefetch" href="https://lijsjlkgydlszdhmsppt.supabase.co" />
      </head>
      <body
        className={`${roboto.variable} ${teko.variable} antialiased`}
      >
        {/* Script carregado apenas após a página estar interativa (não bloqueia renderização) */}
        <Script 
          src="https://analytics.ahrefs.com/analytics.js" 
          data-key="Sam0BvC3Nm1qohD+XzVeLA" 
          strategy="lazyOnload" 
        />

        {/* Componente otimizado do Next.js para Google Analytics */}
        <GoogleAnalytics gaId="G-2L2F9CY9JN" />

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

