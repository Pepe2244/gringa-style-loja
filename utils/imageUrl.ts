import { buildStorageUrl } from '@/lib/site-config';

export function getProxiedImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/supabase-assets/')) return url;

    const supabaseRegex = /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;

    if (supabaseRegex.test(url)) {
      return url.replace(supabaseRegex, '/supabase-assets/');
    }

    return url;
}

export function toStorageUrl(path: string) {
    return buildStorageUrl(path);
}
