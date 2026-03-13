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
  // GROWTH HACK: Lemos o cookie no SERVIDOR. 
  // O Next 15+ exige o await em cookies().
  const cookieStore = await cookies();
  const hasConsent = cookieStore.get('cookie-consent')?.value === 'true';

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://lijsjlkgydlszdhmsppt.supabase.co" />
        <link rel="dns-prefetch" href="https://lijsjlkgydlszdhmsppt.supabase.co" />
      </head>
      <body className={`${roboto.variable} ${teko.variable} antialiased`}>
        <Script src="https://analytics.ahrefs.com/analytics.js" data-key="Sam0BvC3Nm1qohD+XzVeLA" strategy="lazyOnload" />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=G-2L2F9CY9JN`} strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2L2F9CY9JN', { page_path: window.location.pathname });
          `}
        </Script>

        <ToastProvider>
          <Header />
          <CampaignBannerServer />
          {children}
          {/* Se o cookie existir, o HTML do banner sequer é enviado para o cliente. Zero peso. */}
          {!hasConsent && <CookieConsent />}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}


