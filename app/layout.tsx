import type { Metadata } from "next";
import { Roboto, Teko } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from '@/context/ToastContext';
import CampaignBannerServer from "@/components/CampaignBannerServer";
import CookieConsent from "@/components/CookieConsent";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import ErrorBoundary from "@/components/ErrorBoundary";
import { cookies } from "next/headers";
import { LocalBusinessSchema, WebSiteSchema, OrganizationSchema } from '@/components/SEO/StructuredData';

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
  metadataBase: new URL('https://www.gringastylebr.com.br'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG",
    template: "%s | Gringa Style"
  },
  description: "Encontre as melhores máscaras de solda personalizadas, automáticas e acessórios para TIG. Estilo e proteção para soldadores profissionais. Confira!",
  keywords: ["máscara de solda", "solda tig", "personalizada", "gringa style", "acessórios solda"],
  openGraph: {
    title: "Gringa Style | Máscaras de Solda Personalizadas",
    description: "Estilo e proteção para soldadores profissionais.",
    url: "https://www.gringastylebr.com.br",
    siteName: "Gringa Style",
    images: [{ url: "/imagens/logo_gringa_style.png", width: 800, height: 600 }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gringa Style',
    description: 'Máscaras de solda personalizadas e acessórios para TIG.',
    images: ['/imagens/logo_gringa_style.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lógica de consentimento no servidor para performance máxima
  const cookieStore = await cookies();
  const hasConsent = cookieStore.get('cookie-consent')?.value === 'true';

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
        {/* DADOS ESTRUTURADOS GLOBAIS - A autoridade da marca no Google */}
        
        {/* Preload dinâmico do banco de dados */}
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body className={`${roboto.variable} ${teko.variable} antialiased`}>
        <LocalBusinessSchema />
        <WebSiteSchema />
        <OrganizationSchema />

        <ToastProvider>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <Header />
              <CampaignBannerServer />
              <main className="flex-grow">
                {children}
              </main>
              {/* Renderização condicional para economia de recursos */}
              {!hasConsent && <CookieConsent />}
              <AnalyticsLoader hasConsent={hasConsent} />
              <Footer />
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}