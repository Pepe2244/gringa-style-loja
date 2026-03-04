import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2592000,
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lijsjlkgydlszdhmsppt.supabase.co',
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
};

export default nextConfig;
