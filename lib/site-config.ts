export const siteConfig = {
  appUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://gringa-style.netlify.app',
  supabase: {
    storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'gringa-style-produtos',
    imageBaseUrl: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BASE_URL || 'https://tsilaaurmpahookyanbe.supabase.co/storage/v1/object/public',
  },
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID || 'G-2L2F9CY9JN',
    ahrefsKey: process.env.AHREFS_KEY || 'Sam0BvC3Nm1qohD+XzVeLA',
    clarityId: process.env.NEXT_PUBLIC_CLARITY_ID || 'vybz5xptlm',
  },
  content: {
    revalidateSeconds: Number(process.env.NEXT_PUBLIC_REVALIDATE_SECONDS || 60),
  },
};

export function getStorageBucket() {
  return siteConfig.supabase.storageBucket;
}

export function getStorageBaseUrl() {
  return siteConfig.supabase.imageBaseUrl;
}

export function buildStorageUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `${getStorageBaseUrl()}/${getStorageBucket()}/${path}`;
}

export function getAnalyticsConfig() {
  return siteConfig.analytics;
}
