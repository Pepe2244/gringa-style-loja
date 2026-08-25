import { unstable_cache } from 'next/cache';

/**
 * Cache distribuído nativo do Next.js.
 * Substitui o Map() in-memory para funcionar perfeitamente em Serverless/Edge.
 * 
 * @param fetcher Função assíncrona que busca os dados (ex: chamadas do Supabase)
 * @param keys Array de strings para identificar o cache internamente
 * @param tags Array de tags para permitir invalidação sob demanda
 * @param ttlSeconds Segundos que o cache deve durar (revalidação baseada em tempo)
 */
export async function getCachedValue<T>(
  fetcher: () => Promise<T>,
  keys: string[],
  tags: string[],
  ttlSeconds: number = 3600 // Padrão: 1 hora
): Promise<T> {
  try {
    const getCachedData = unstable_cache(
      async () => {
        const data = await fetcher();
        return data;
      },
      keys,
      {
        tags: tags,
        revalidate: ttlSeconds,
      }
    );

    return await getCachedData();
  } catch (error) {
    console.error(`Falha no cache distribuído para as keys [${keys.join(', ')}]:`, error);
    throw error;
  }
}