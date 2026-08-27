/**
 * In-memory LRU cache with TTL, stale-while-revalidate, and request deduplication.
 *
 * This is the primary hot-path cache. It is intentionally kept simple:
 *  - Fixed max entry count per namespace
 *  - LRU eviction when full
 *  - No serialization cost (stores live JS objects)
 *  - Zero dependencies
 */

import {
  type CacheEntry,
  type CacheOptions,
  type CacheState,
  TTL,
  STALE_MULTIPLIER,
} from './types';
import { cacheLog } from './logger';

const DEFAULT_MAX_ENTRIES = 200;

/**
 * A namespace-partitioned in-memory LRU cache.
 * One global instance is created at module load and shared across the app.
 */
class MemoryCache {
  // namespace → (key → entry)
  private readonly store = new Map<string, Map<string, CacheEntry>>();
  // in-flight dedup: key → Promise<unknown>
  private readonly inflight = new Map<string, Promise<unknown>>();

  // ── Helpers ────────────────────────────────────────────────────────────────

  private ns(namespace: string): Map<string, CacheEntry> {
    if (!this.store.has(namespace)) {
      this.store.set(namespace, new Map());
    }
    return this.store.get(namespace)!;
  }

  private getState(entry: CacheEntry): CacheState {
    const now = Date.now();
    if (now < entry.staleAt) return 'FRESH';
    if (now < entry.expiresAt) return 'STALE';
    return 'EXPIRED';
  }

  private estimateBytes(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 approximation
    } catch {
      return 0;
    }
  }

  /**
   * LRU eviction: when a namespace exceeds maxEntries, remove the
   * least-recently-accessed entry.
   */
  private evict(namespace: string, maxEntries: number): void {
    const store = this.ns(namespace);
    if (store.size <= maxEntries) return;

    let lruKey = '';
    let lruTime = Infinity;

    for (const [key, entry] of store) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      store.delete(lruKey);
      cacheLog('CACHE EVICTED', `${namespace}:${lruKey}`);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Read an entry. Returns null if missing or expired. Updates lastAccessedAt. */
  get<T>(namespace: string, key: string): CacheEntry<T> | null {
    const store = this.ns(namespace);
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const state = this.getState(entry);
    if (state === 'EXPIRED') {
      store.delete(key);
      cacheLog('CACHE MISS', `${namespace}:${key}`, { reason: 'EXPIRED' });
      return null;
    }

    entry.lastAccessedAt = Date.now();
    entry.state = state;
    return entry;
  }

  /** Write an entry. Evicts LRU if over capacity. */
  set<T>(
    namespace: string,
    key: string,
    data: T,
    options: CacheOptions,
  ): CacheEntry<T> {
    const { ttl, staleTtl, maxEntries = DEFAULT_MAX_ENTRIES } = options;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: now,
      updatedAt: now,
      staleAt: now + ttl,
      expiresAt: now + ttl * (staleTtl !== undefined ? staleTtl / ttl : STALE_MULTIPLIER),
      lastAccessedAt: now,
      version: (this.ns(namespace).get(key)?.version ?? 0) + 1,
      state: 'FRESH',
      byteSize: this.estimateBytes(data),
    };

    const store = this.ns(namespace);
    store.set(key, entry as CacheEntry);
    this.evict(namespace, maxEntries);

    cacheLog('CACHE SET', `${namespace}:${key}`, {
      ttl: `${ttl / 1000}s`,
      byteSize: entry.byteSize,
    });

    return entry;
  }

  /** Delete a specific key from a namespace. */
  delete(namespace: string, key: string): void {
    const deleted = this.ns(namespace).delete(key);
    if (deleted) cacheLog('CACHE INVALIDATED', `${namespace}:${key}`);
  }

  /** Delete all keys in a namespace (e.g. after a write that affects a list). */
  invalidateNamespace(namespace: string): void {
    const store = this.ns(namespace);
    const size = store.size;
    store.clear();
    if (size > 0) cacheLog('CACHE INVALIDATED', namespace, { entries: size });
  }

  /** Delete keys across namespaces that match a tag or prefix. */
  invalidateByPrefix(prefix: string): void {
    for (const [ns, store] of this.store) {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
          store.delete(key);
          cacheLog('CACHE INVALIDATED', `${ns}:${key}`, { reason: 'prefix match' });
        }
      }
    }
  }

  /** Clear all namespaces. */
  clear(): void {
    this.store.clear();
  }

  // ── Request deduplication ──────────────────────────────────────────────────

  /**
   * Returns an existing in-flight promise for `dedupKey`, or registers `promise`
   * as the canonical in-flight request and returns it.
   *
   * Call `resolveDedup(dedupKey)` after the promise settles to clean up.
   */
  dedup<T>(dedupKey: string, promise: Promise<T>): Promise<T> {
    if (this.inflight.has(dedupKey)) {
      cacheLog('REQUEST DEDUPED', dedupKey);
      return this.inflight.get(dedupKey) as Promise<T>;
    }
    this.inflight.set(dedupKey, promise);
    promise.finally(() => this.inflight.delete(dedupKey));
    return promise;
  }

  hasInflight(dedupKey: string): boolean {
    return this.inflight.has(dedupKey);
  }

  getInflight<T>(dedupKey: string): Promise<T> | undefined {
    return this.inflight.get(dedupKey) as Promise<T> | undefined;
  }
}

// Singleton — one cache for the entire browser session
export const memoryCache = new MemoryCache();
