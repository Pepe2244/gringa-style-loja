const normalizeSiteUrl = (value: string | undefined) => {
  const base = (value || 'https://gringastylebr.com.br').trim();
  return base.replace(/\/+$/, '');
};

export const siteConfig = {
  appUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  supportEmail: 'contato@gringastylebr.com.br',
  supabase: {
    storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'gringa-style-produtos',
    imageBaseUrl: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BASE_URL ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public` : 'https://evgabdhvekmdhfvzteow.supabase.co/storage/v1/object/public'),
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

export function buildCanonicalUrl(path = '/') {
  const cleanPath = String(path || '/').trim();

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath.replace(/\/+$/, '') || siteConfig.appUrl;
  }

  const normalizedPath = cleanPath === '/' ? '' : `/${cleanPath.replace(/^\/+|\/+$/g, '')}`;
  return `${siteConfig.appUrl}${normalizedPath}`;
}

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
