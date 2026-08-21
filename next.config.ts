import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";
const cspValue = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://analytics.ahrefs.com https://www.clarity.ms https://c.clarity.ms https://scripts.clarity.ms; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;"
  : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com https://www.clarity.ms https://c.clarity.ms https://scripts.clarity.ms; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;";

const nextConfig: NextConfig = {
  // Força o compilador a alvejar navegadores modernos, eliminando polyfills legados desnecessários
  compiler: {
    removeConsole: !isDevelopment,
  },
  
  experimental: {
    serverActions: {
      allowedOrigins: [
        'probable-trout-979jr97rr7q53x7qx-3000.app.github.dev',
        '*.app.github.dev',
        'localhost:3000',
      ],
    },
  },

  images: {
    qualities: [75, 85], // Qualidade ajustada para melhor balanço visual/performance sem reprocessamentos excessivos
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
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
