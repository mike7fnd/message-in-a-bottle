/**
 * smartFetch — the unified caching layer.
 *
 * Architecture:
 *   UI
 *    ↓
 *   smartFetch (this file)
 *    ├── Memory Cache (hot path, in-process)
 *    ├── Persistent Cache (localStorage, survives refresh)
 *    ├── Request Deduplication (inflight map)
 *    ├── TTL / Freshness
 *    ├── Stale-While-Revalidate (serve stale, refresh in background)
 *    └── Cache Invalidation helpers
 *    ↓
 *   Fetcher function (Firestore / fetch API / etc.)
 *
 * Usage:
 *   const data = await smartFetch({
 *     namespace: 'recipients',
 *     key: 'all',
 *     ttl: TTL.MEDIUM,
 *     persist: true,
 *     fetcher: () => getRecipientsByFallback(),
 *     onFresh: (data) => setState(data),       // optional SWR callback
 *   });
 */

import { type CacheOptions, type FetchResult, type CacheState, TTL } from './types';
import { memoryCache } from './memory-cache';
import { persistentCache } from './persistent-cache';
import { cacheLog } from './logger';

export interface SmartFetchOptions<T> extends CacheOptions {
  namespace: string;
  key: string;
  fetcher: () => Promise<T>;
  /**
   * Called when a background revalidation completes (SWR).
   * Use this to update UI state with fresh data.
   */
  onFresh?: (data: T) => void;
  /**
   * If true, skip cache entirely and always fetch fresh.
   * Use only for mutations or admin views.
   */
  forceRefresh?: boolean;
}

export async function smartFetch<T>(opts: SmartFetchOptions<T>): Promise<FetchResult<T>> {
  const {
    namespace,
    key,
    fetcher,
    ttl,
    staleTtl,
    persist = false,
    maxEntries,
    onFresh,
    forceRefresh = false,
  } = opts;

  const dedupKey = `${namespace}:${key}`;
  const cacheOpts: CacheOptions = { ttl, staleTtl, persist, maxEntries };

  // ── 1. Force refresh bypass ────────────────────────────────────────────────
  if (forceRefresh) {
    return _fetch(namespace, key, dedupKey, fetcher, cacheOpts, persist, onFresh, 'MISSING');
  }

  // ── 2. Memory cache lookup ─────────────────────────────────────────────────
  const memEntry = memoryCache.get<T>(namespace, key);

  if (memEntry) {
    if (memEntry.state === 'FRESH') {
      cacheLog('CACHE HIT', dedupKey, { layer: 'memory', state: 'FRESH' });
      return { data: memEntry.data, cacheState: 'FRESH', fromCache: true };
    }

    if (memEntry.state === 'STALE') {
      // Serve stale immediately, revalidate in background
      cacheLog('STALE → REVALIDATING', dedupKey, { layer: 'memory' });
      _fetchBackground(namespace, key, dedupKey, fetcher, cacheOpts, persist, onFresh);
      return { data: memEntry.data, cacheState: 'STALE', fromCache: true };
    }
  }

  // ── 3. Persistent cache lookup ─────────────────────────────────────────────
  if (persist) {
    const persEntry = persistentCache.get<T>(namespace, key);

    if (persEntry) {
      const now = Date.now();
      const isStale = now >= persEntry.staleAt;

      // Promote to memory cache
      memoryCache.set(namespace, key, persEntry.data, cacheOpts);

      if (!isStale) {
        cacheLog('CACHE HIT', dedupKey, { layer: 'persistent', state: 'FRESH' });
        return { data: persEntry.data, cacheState: 'FRESH', fromCache: true };
      }

      // Stale in persistent cache — serve and revalidate
      cacheLog('STALE → REVALIDATING', dedupKey, { layer: 'persistent' });
      _fetchBackground(namespace, key, dedupKey, fetcher, cacheOpts, persist, onFresh);
      return { data: persEntry.data, cacheState: 'STALE', fromCache: true };
    }
  }

  // ── 4. Cache miss — fetch ──────────────────────────────────────────────────
  cacheLog('CACHE MISS', dedupKey);
  return _fetch(namespace, key, dedupKey, fetcher, cacheOpts, persist, onFresh, 'MISSING');
}

// ── Private helpers ──────────────────────────────────────────────────────────

async function _fetch<T>(
  namespace: string,
  key: string,
  dedupKey: string,
  fetcher: () => Promise<T>,
  cacheOpts: CacheOptions,
  persist: boolean,
  onFresh?: (data: T) => void,
  priorState: CacheState = 'MISSING',
): Promise<FetchResult<T>> {
  // Dedup: if an identical request is in flight, reuse it
  const existing = memoryCache.getInflight<T>(dedupKey);
  if (existing) {
    cacheLog('REQUEST DEDUPED', dedupKey);
    const data = await existing;
    return { data, cacheState: priorState, fromCache: false };
  }

  const promise = fetcher();
  const deduped = memoryCache.dedup(dedupKey, promise);

  try {
    const data = await deduped;
    memoryCache.set(namespace, key, data, cacheOpts);
    if (persist) persistentCache.set(namespace, key, data, cacheOpts);
    onFresh?.(data);
    return { data, cacheState: 'FRESH', fromCache: false };
  } catch (err) {
    cacheLog('CACHE ERROR', dedupKey, err);
    throw err;
  }
}

function _fetchBackground<T>(
  namespace: string,
  key: string,
  dedupKey: string,
  fetcher: () => Promise<T>,
  cacheOpts: CacheOptions,
  persist: boolean,
  onFresh?: (data: T) => void,
): void {
  // Don't launch another background fetch if one is already running
  if (memoryCache.hasInflight(dedupKey)) return;

  _fetch(namespace, key, dedupKey, fetcher, cacheOpts, persist, onFresh, 'STALE').catch(
    (err) => cacheLog('CACHE ERROR', `${dedupKey} (bg revalidate)`, err),
  );
}

// ── Cache invalidation helpers (call after mutations) ────────────────────────

/**
 * Invalidate a single key in both memory and persistent cache.
 * Call after editing/deleting a specific record.
 */
export function invalidateKey(namespace: string, key: string): void {
  memoryCache.delete(namespace, key);
  persistentCache.delete(namespace, key);
}

/**
 * Invalidate an entire namespace in both layers.
 * Call after creating/deleting records that affect a list.
 */
export function invalidateNamespace(namespace: string): void {
  memoryCache.invalidateNamespace(namespace);
  persistentCache.invalidateNamespace(namespace);
}

/**
 * Invalidate multiple namespaces at once.
 */
export function invalidateMany(namespaces: string[]): void {
  namespaces.forEach(invalidateNamespace);
}
