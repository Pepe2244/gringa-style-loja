import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const cspConnectSrc = "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://*.google.com https://*.doubleclick.net https://stats.g.doubleclick.net https://*.clarity.ms https://*.ahrefs.com https://*.cloudflareinsights.com https://pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev https://viacep.com.br https://api.indexnow.org;";
const cspImgSrc = "img-src 'self' data: blob: https:;";
const cspValue = isDevelopment
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://analytics.ahrefs.com https://*.clarity.ms https://www.clarity.ms https://c.clarity.ms https://scripts.clarity.ms https://static.cloudflareinsights.com https://cloudflareinsights.com; worker-src 'self' blob:; ${cspConnectSrc} ${cspImgSrc} object-src 'none'; frame-ancestors 'none';`
  : `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com https://*.clarity.ms https://www.clarity.ms https://c.clarity.ms https://scripts.clarity.ms https://static.cloudflareinsights.com https://cloudflareinsights.com; worker-src 'self' blob:; ${cspConnectSrc} ${cspImgSrc} object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;`;
const r2RemotePattern = (() => {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    if (url.protocol !== 'https:') return null;
    const basePath = url.pathname.replace(/\/+$/, '');
    return {
      protocol: 'https' as const,
      hostname: url.hostname,
      port: url.port,
      pathname: `${basePath}/**`,
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,

  compiler: {
    removeConsole: !isDevelopment ? { exclude: ['error', 'warn'] } : false,
    reactRemoveProperties: !isDevelopment,
  },
  
  experimental: {
    serverActions: {
      allowedOrigins: [
        '*.app.github.dev',
        'localhost:3000',
        'gringastylebr.com.br',
        'www.gringastylebr.com.br',
      ],
    },
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    qualities: [60, 65, 75],
    deviceSizes: [320, 384, 428, 540, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      ...(r2RemotePattern ? [r2RemotePattern] : []),
      {
        protocol: 'https',
        hostname: 'pub-564d2f4b7a4d46f0a354513cc782519c.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async rewrites() {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://evgabdhvekmdhfvzteow.supabase.co').replace(/\/+$/, '');
    return [
      {
        source: '/supabase-assets/:path*',
        destination: `${supabaseUrl}/storage/v1/object/public/:path*`,
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.gringastylebr.com.br',
          },
        ],
        destination: 'https://gringastylebr.com.br/:path*',
        permanent: true,
      },
      // 1. Redirecionamento de slugs legados/malformados para os novos slugs canônicos
      {
        source: '/produto/culos-steelflex-neon--proteo-ocular-e-estilo-streetwear',
        destination: '/produto/oculos-steelflex-neon-protecao-ocular-e-estilo-streetwear',
        permanent: true,
      },
      {
        source: '/produto/bota-de-segurana-detroit-pro-bracol---cano-mdio-preto-e-vermelho',
        destination: '/produto/bota-de-seguranca-detroit-pro-bracol-cano-medio-preto-e-vermelho',
        permanent: true,
      },
      {
        source: '/produto/lente-de-solda-passiva-oudopanda---classe-ptica-1111-profissional',
        destination: '/produto/lente-de-solda-passiva-oudopanda-classe-optica-1-1-1-1-profissional',
        permanent: true,
      },
      {
        source: '/produto/lente-de-solda-passiva-oudopanda-classe-optica-1111-profissional',
        destination: '/produto/lente-de-solda-passiva-oudopanda-classe-optica-1-1-1-1-profissional',
        permanent: true,
      },
      {
        source: '/produto/bon-gringa-style-classic-aba-curva---casual-preto',
        destination: '/produto/bone-gringa-style-classic-aba-curva-casual-preto',
        permanent: true,
      },
      {
        source: '/produto/tocha-tig-wp-26-profissional-alta-amperagem---punho-ergonmico-',
        destination: '/produto/tocha-tig-wp-26-profissional-alta-amperagem-punho-ergonomico',
        permanent: true,
      },
      {
        source: '/produto/camisa-de-soldador-gringa-style-manga-longa---tecido-retardante-a-chamas',
        destination: '/produto/camisa-de-soldador-gringa-style-manga-longa-tecido-retardante-a-chamas',
        permanent: true,
      },
      {
        source: '/produto/kit-consumveis-tig-completo-para-tochas--estojo',
        destination: '/produto/kit-consumiveis-tig-completo-para-tochas-estojo',
        permanent: true,
      },
      {
        source: '/produto/camiseta-gringa-style--oudopanda---premium-edio-soldador',
        destination: '/produto/camiseta-gringa-style-oudopanda-premium-edicao-soldador',
        permanent: true,
      },
      {
        source: '/produto/camiseta-gringa-style-quotoudopandaquot-premium-edicao-soldador',
        destination: '/produto/camiseta-gringa-style-oudopanda-premium-edicao-soldador',
        permanent: true,
      },
      {
        source: '/produto/kit-guerreiro-gtaw---gringa-style',
        destination: '/produto/kit-guerreiro-gtaw-gringa-style',
        permanent: true,
      },
      {
        source: '/produto/kit-guerreiro-gtaw-',
        destination: '/produto/kit-guerreiro-gtaw-gringa-style',
        permanent: true,
      },
      {
        source: '/produto/kit-gringa-style-air--mscara-minimalista-white--botina-miura-premium',
        destination: '/produto/kit-gringa-style-air-mascara-minimalista-white-botina-miura-premium',
        permanent: true,
      },
      {
        source: '/produto/bon-snapback-gringa-style---bordado-3d-em-alto-relevo',
        destination: '/produto/bone-snapback-gringa-style-bordado-3d-em-alto-relevo',
        permanent: true,
      },
      {
        source: '/produto/estilo-tropical---mscara-de-solda-em-fibra-de-vidro-personalizada',
        destination: '/produto/estilo-tropical-mascara-de-solda-em-fibra-de-vidro-personalizada',
        permanent: true,
      },
      {
        source: '/produto/mscara-de-solda-profissional-em-fibra-de-vidro',
        destination: '/produto/mascara-de-solda-profissional-em-fibra-de-vidro',
        permanent: true,
      },
      {
        source: '/produto/mscara-de-solda---air-model',
        destination: '/produto/mascara-de-solda-air-model',
        permanent: true,
      },
      {
        source: '/produto/camisa-gringa-style---copa-do-mundo-',
        destination: '/produto/camisa-gringa-style-copa-do-mundo',
        permanent: true,
      },
      {
        source: '/produto/mochila-bfalo-cwb-tech--safe---resistncia-urbana',
        destination: '/produto/mochila-bufalo-cwb-tech-safe-resistencia-urbana',
        permanent: true,
      },
      {
        source: '/produto/camiseta-gringa-style-artist-series---estampas-exclusivas-autorais',
        destination: '/produto/camiseta-gringa-style-artist-series-estampas-exclusivas-autorais',
        permanent: true,
      },
      {
        source: '/produto/bon-gringa-style-aba-curva',
        destination: '/produto/bone-gringa-style-aba-curva',
        permanent: true,
      },
      {
        source: '/produto/lente-automtica-lake-michigan-tefuwane--gringa-style',
        destination: '/produto/lente-automatica-lake-michigan-tefuwane-gringa-style',
        permanent: true,
      },
      {
        source: '/produto/cabo-de-madeira-anatmico-para-tocha-tig---gringa-style',
        destination: '/produto/cabo-de-madeira-anatomico-para-tocha-tig-gringa-style',
        permanent: true,
      },
      {
        source: '/produto/mscara-de-solda-personalizada-gringa-style---couro-legtimo--alta-performance',
        destination: '/produto/mascara-de-solda-personalizada-gringa-style-couro-legitimo-alta-performance',
        permanent: true,
      },
      {
        source: '/produto/mascara-de-solda-personalizada-gringa-style-couro-legitimo-e-alta-performance',
        destination: '/produto/mascara-de-solda-personalizada-gringa-style-couro-legitimo-alta-performance',
        permanent: true,
      },
      {
        source: '/produto/mscara-de-solda-gringa-style---croco-green--sand',
        destination: '/produto/mascara-de-solda-gringa-style-linha-sand-croco',
        permanent: true,
      },
      {
        source: '/produto/mascara-de-solda-gringa-style-croco-green-sand',
        destination: '/produto/mascara-de-solda-gringa-style-linha-sand-croco',
        permanent: true,
      },
      {
        source: '/produto/botina-miura-premium-em-couro-nobuck---conforto-ttico-e-resistncia-extrema',
        destination: '/produto/botina-miura-premium-em-couro-nobuck-conforto-tatico-e-resistencia-extrema',
        permanent: true,
      },
      // Slugs com prefixo numérico legados (encontrados em backlinks e Netlify)
      {
        source: '/produto/8-bon-gringa-style-aba-curva',
        destination: '/produto/bone-gringa-style-aba-curva',
        permanent: true,
      },
      {
        source: '/produto/12-bon-snapback-gringa-style---bordado-3d-em-alto-relevo',
        destination: '/produto/bone-snapback-gringa-style-bordado-3d-em-alto-relevo',
        permanent: true,
      },
      // 2. Rotas antigas e links obsoletos mapeados
      {
        source: '/pages/contact',
        destination: '/sobre',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/loja',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/imagens/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue,
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
