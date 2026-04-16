import type { Metadata } from "next";
import { Roboto, Teko } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from '@/context/ToastContext';
import CampaignBannerServer from "@/components/CampaignBannerServer";
import CookieConsent from "@/components/CookieConsent";
import { cookies } from "next/headers";
import { GoogleAnalytics } from '@next/third-parties/google';
import { LocalBusinessSchema, WebSiteSchema, OrganizationSchema } from '@/components/SEO/StructuredData';

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
  metadataBase: new URL('https://gringa-style.netlify.app'),
  alternates: { canonical: './' },
  title: "Gringa Style | Máscaras de Solda Personalizadas e Acessórios TIG",
  description: "Encontre as melhores máscaras de solda personalizadas, automáticas e acessórios para TIG. Estilo e proteção para soldadores profissionais. Confira!",
  keywords: ["máscara de solda", "solda tig", "personalizada", "gringa style", "acessórios solda"],
  openGraph: {
    title: "Gringa Style | Máscaras de Solda Personalizadas",
    description: "Estilo e proteção para soldadores profissionais.",
    url: "https://gringa-style.netlify.app",
    siteName: "Gringa Style",
    images: [{ url: "/imagens/logo_gringa_style.png", width: 800, height: 600 }],
    locale: "pt_BR",
    type: "website",
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

  // CONFIGURAÇÕES DE ANALYTICS
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-2L2F9CY9JN";
  const AHREFS_KEY = process.env.AHREFS_KEY || "Sam0BvC3Nm1qohD+XzVeLA";

  return (
    <html lang="pt-BR">
      <head>
        {/* DADOS ESTRUTURADOS GLOBAIS - A autoridade da marca no Google */}
        <LocalBusinessSchema />
        <WebSiteSchema />
        <OrganizationSchema />

        {/* Preload dinâmico do banco de dados */}
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      <body className={`${roboto.variable} ${teko.variable} antialiased`}>
        {/* Scripts de Terceiros com carregamento otimizado */}
        <Script 
          src="https://analytics.ahrefs.com/analytics.js" 
          data-key={AHREFS_KEY} 
          strategy="lazyOnload" 
        />
        
        <GoogleAnalytics gaId={GA_ID} />

        {/* Microsoft Clarity para análise de comportamento de conversão */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vybz5xptlm");
          `}
        </Script>

        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <CampaignBannerServer />
            <main className="flex-grow">
              {children}
            </main>
            {/* Renderização condicional para economia de recursos */}
            {!hasConsent && <CookieConsent />}
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}