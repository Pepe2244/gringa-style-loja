import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 1. A MÁGICA DA COMPRESSÃO: Força o servidor a converter imagens para AVIF e WebP
    formats: ['image/avif', 'image/webp'],

    // 2. Cache máximo (1 ano) para calar o aviso do Google PageSpeed
    minimumCacheTTL: 31536000, 

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lijsjlkgydlszdhmsppt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Mantive a tua configuração do Cloudinary
        port: '',
        pathname: '/**',
      }
    ],
  },

  // 3. Limpeza de lixo em Produção
  // O PageSpeed acusou "JavaScript legado". Isto remove todos os console.log() do teu código
  // quando for para produção, poupando bytes desnecessários no telemóvel do utilizador.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;


