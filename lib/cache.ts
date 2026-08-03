const inMemoryCache = new Map<string, { value: any; expiresAt: number }>();

export function getCachedValue<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = inMemoryCache.get(key);

  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.value as T);
  }

  return fetcher().then((value) => {
    inMemoryCache.set(key, { value, expiresAt: now + ttlMs });
    return value;
  });
}

export function invalidateCache(key: string) {
  inMemoryCache.delete(key);
}

export function invalidateCachePrefix(prefix: string) {
  for (const cachedKey of inMemoryCache.keys()) {
    if (cachedKey.startsWith(prefix)) {
      inMemoryCache.delete(cachedKey);
    }
  }
}
