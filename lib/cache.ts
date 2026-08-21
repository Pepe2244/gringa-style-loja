const inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

export async function getCachedValue<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = inMemoryCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  try {
    const value = await fetcher();
    // Só grava no cache se a busca for bem sucedida (evita cachear erros)
    inMemoryCache.set(key, { value, expiresAt: now + ttlMs });
    return value;
  } catch (error) {
    console.error(`Falha ao processar fetcher para o cache [${key}]:`, error);
    throw error;
  }
}

export function invalidateCache(key: string): void {
  inMemoryCache.delete(key);
}

export function invalidateCachePrefix(prefix: string): void {
  for (const cachedKey of inMemoryCache.keys()) {
    if (cachedKey.startsWith(prefix)) {
      inMemoryCache.delete(cachedKey);
    }
  }
}

// Botão de pânico para limpar toda a memória (Usado após deletar produtos)
export function clearAllCache(): void {
  inMemoryCache.clear();
}