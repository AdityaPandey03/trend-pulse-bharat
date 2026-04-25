/**
 * Tiny in-process cache with TTL.
 *
 * Why in-memory and not Redis: this is a one-serverless-instance demo.
 * In production we'd swap this for Vercel KV / Upstash Redis so multiple
 * function instances share the cache. The interface is the same so the
 * swap is trivial.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store: Map<string, CacheEntry<unknown>> = (globalThis as typeof globalThis & {
  __trendsCache?: Map<string, CacheEntry<unknown>>;
}).__trendsCache ?? new Map();

(globalThis as typeof globalThis & { __trendsCache?: Map<string, CacheEntry<unknown>> }).__trendsCache = store;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheTtlRemaining(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
}
