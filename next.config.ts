import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 1. RESOLUÇÃO DE ERROS DE LOG: Adicionado o 60 para parar o erro de "unconfigured qualities"
    qualities: [60, 75],

    // 2. MÁGICA DA COMPRESSÃO: Converte para formatos ultra-leves (AVIF é 20% menor que WebP)
    formats: ['image/avif', 'image/webp'],

    // 3. CACHE AGRESSIVO: 1 ano de cache para passar no Google PageSpeed
    minimumCacheTTL: 31536000, 

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tsilaaurmpahookyanbe.supabase.co', // ID Corrigido e funcional
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },



  // 5. LIMPEZA DE LIXO EM PRODUÇÃO: Remove console.logs para economizar processamento e privacidade
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // SEGURANÇA ENTERPRISE: Cabeçalhos HTTP para proteção contra Hackers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;"
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ];
  },
};

export default nextConfig;