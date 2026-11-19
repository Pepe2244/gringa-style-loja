import type { Metadata } from 'next';
import GSServicosIndustriaisPage from '@/components/SoldasEspeciaisPage';
import { BreadcrumbSchema, WebPageSchema } from '@/components/SEO/StructuredData';
import { buildCanonicalUrl, siteConfig } from '@/lib/site-config';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: 'GS Soluções Industriais | Soldas Especiais, Mecânica e Engenharia de Manutenção',
  },
  description: 'Soluções avançadas em soldas especiais de alta integridade, recuperação dimensional de peças e manutenção mecânica industrial em todo o Brasil.',
  alternates: { canonical: buildCanonicalUrl('/gs-servicos-industriais') },
  openGraph: {
    title: 'GS Soluções Industriais | Soldas Especiais, Mecânica e Engenharia de Manutenção',
    description: 'Soluções avançadas em soldas especiais de alta integridade, recuperação dimensional de peças e manutenção mecânica industrial em todo o Brasil.',
    url: buildCanonicalUrl('/gs-servicos-industriais'),
    siteName: 'GS Soluções Industriais',
    images: [{ url: new URL('/imagens/logo_gs_servicos_industriais_v2.png', siteConfig.appUrl).toString(), width: 1024, height: 1024, alt: 'Logo GS Soluções Industriais' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GS Soluções Industriais | Soldas Especiais e Mecânica Industrial',
    description: 'Soluções industriais especializadas em soldas de alta precisão, recuperação de ativos e engenharia de manutenção.',
    images: [new URL('/imagens/logo_gs_servicos_industriais_v2.png', siteConfig.appUrl).toString()],
  },
};

export default async function GSServicosIndustriaisRoute() {
  let initialAssets: any[] = [];
  try {
    const { data, error } = await supabase
      .from('b2b_assets')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      initialAssets = data;
    }
  } catch (err) {
    console.warn('Falha ao carregar b2b_assets no servidor:', err);
  }

  return (
    <>
      <WebPageSchema
        page={{
          name: 'GS Soluções Industriais | Soldas Especiais, Mecânica e Engenharia de Manutenção',
          description: 'Soluções avançadas em soldas especiais de alta integridade, recuperação dimensional de peças e manutenção mecânica industrial em todo o Brasil.',
          url: buildCanonicalUrl('/gs-servicos-industriais'),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Gringa Style', url: '/' },
          { name: 'GS Soluções Industriais', url: '/gs-servicos-industriais' },
        ]}
      />
      <GSServicosIndustriaisPage initialAssets={initialAssets} />
    </>
  );
}
