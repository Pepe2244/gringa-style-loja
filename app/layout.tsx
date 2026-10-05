import type { Metadata } from "next";
import { Roboto, Teko } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/context/ToastContext";
import CampaignBannerServer from "@/components/CampaignBannerServer";
import CookieConsent from "@/components/CookieConsent";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  LocalBusinessSchema,
  WebSiteSchema,
  OrganizationSchema,
} from "@/components/SEO/StructuredData";
import ScrollToTop from "@/components/ScrollToTop";
import { MotionConfig } from "framer-motion";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gringastylebr.com.br"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG",
    template: "%s | Gringa Style",
  },
  description:
    "Máscaras de solda personalizadas em fibra de vidro, EPIs e acessórios para soldagem TIG/MIG. Pronta entrega para todo o Brasil, PIX e até 12x sem juros.",
  keywords: [
    "máscara de solda personalizada",
    "máscara de solda tig",
    "epi soldador",
    "fibra de vidro",
    "solda mig",
    "gringa style",
    "acessórios de solda",
    "boné soldador",
    "botina soldador",
    "tocha solda",
  ],
  openGraph: {
    title: "Gringa Style | Máscaras de Solda Personalizadas",
    description: "Estilo e proteção para soldadores profissionais.",
    url: "https://gringastylebr.com.br",
    siteName: "Gringa Style",
    images: [{ url: "/imagens/logo_gringa_style.png", width: 800, height: 600 }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gringa Style",
    description: "Máscaras de solda personalizadas e acessórios para TIG.",
    images: ["/imagens/logo_gringa_style.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SEGURANÇA: Extração da URL do Supabase via Env Var
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseOrigin = "";

  if (supabaseUrl) {
    try {
      supabaseOrigin = new URL(supabaseUrl).origin;
    } catch (e) {
      console.error("Invalid NEXT_PUBLIC_SUPABASE_URL");
    }
  }

  return (
    <html lang="pt-BR">
      <head>
        {/* Preload dinâmico do banco de dados */}
        {supabaseOrigin && (
          <>
            <link
              rel="preconnect"
              href={supabaseOrigin}
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body className={`${roboto.variable} ${teko.variable} antialiased`}>
        <LocalBusinessSchema />
        <WebSiteSchema />
        <OrganizationSchema />

        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <ErrorBoundary>
              <div className="flex flex-col min-h-screen">
                <Header />
                <CampaignBannerServer />
                <main className="flex-grow">{children}</main>

                <CookieConsent />
                <AnalyticsLoader />

                <Footer />
                <ScrollToTop />
              </div>
            </ErrorBoundary>
          </ToastProvider>
        </MotionConfig>
      </body>
    </html>
  );
}