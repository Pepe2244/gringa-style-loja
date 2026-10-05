import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const cspValue = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://analytics.ahrefs.com https://www.clarity.ms https://c.clarity.ms https://scripts.clarity.ms; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;"
  : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com https://www.clarity.ms https://c.clarity.ms https://scripts.clarity.ms; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;";
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

  compiler: {
    removeConsole: !isDevelopment,
    reactRemoveProperties: !isDevelopment,
  },
  
  experimental: {
    serverActions: {
      allowedOrigins: [
        'probable-trout-979jr97rr7q53x7qx-3000.app.github.dev',
        '*.app.github.dev',
        'localhost:3000',
        'gringastylebr.com.br',
        'www.gringastylebr.com.br',
      ],
    },
    optimizePackageImports: ['lucide-react'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [320, 428, 540, 640, 750, 828, 1080, 1200, 1920],
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

  async redirects() {
    return [
      // 1. Remove dinamicamente prefixos numéricos de slugs (/produto/2-estilo-tropical -> /produto/estilo-tropical)
      {
        source: '/produto/:id(\\d+)-:slug',
        destination: '/produto/:slug',
        permanent: true,
      },

      // 2. Redireciona URLs que eram apenas IDs numéricos legados (/produto/14 -> /loja)
      {
        source: '/produto/:id(\\d+)',
        destination: '/loja',
        permanent: true,
      },

      // 3. Normalização de URLs específicas com hífen residual no final
      {
        source: '/produto/kit-guerreiro-gtaw-',
        destination: '/produto/kit-guerreiro-gtaw',
        permanent: true,
      },
      {
        source: '/produto/1-mscara-de-solda-pronta-entrega-',
        destination: '/produto/estilo-tropical---mscara-de-solda-em-fibra-de-vidro-personalizada',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
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
