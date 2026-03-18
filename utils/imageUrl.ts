export function getProxiedImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/supabase-assets/')) return url;
  
    // Expressão regular para substituir URLs baseadas no Supabase Storage pelo proxy
    // Funciona para qualquer Project ID preservando o Bucket Name e Path
    const supabaseRegex = /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;
    
    if (supabaseRegex.test(url)) {
      return url.replace(supabaseRegex, '/supabase-assets/');
    }
  
    return url;
  }
