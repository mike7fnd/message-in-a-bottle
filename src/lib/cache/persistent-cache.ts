/**
 * Persistent cache backed by localStorage.
 *
 * Scope: medium-lived data that should survive page refresh but is NOT sensitive.
 *  - Recipient lists
 *  - Per-recipient message arrays
 *  - Reviews
 *  - Site content (already loaded once)
 *
 * NOT stored here:
 *  - User credentials / tokens
 *  - Private messages belonging to a specific user (use sessionStorage or memory only)
 *  - Anything flagged as sensitive
 *
 * Format on disk:
 *   localStorage key: `mitb_cache:${namespace}:${key}`
 *   value: JSON-serialized CacheEntry
 */

import { type CacheEntry, type CacheOptions, STALE_MULTIPLIER } from './types';
import { cacheLog } from './logger';

const KEY_PREFIX = 'mitb_cache:';
// Safety cap: don't let persistent cache grow beyond this many bytes
const MAX_TOTAL_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_ENTRIES_PER_NS = 50;

function storageKey(namespace: string, key: string): string {
  return `${KEY_PREFIX}${namespace}:${key}`;
}

function estimateBytes(str: string): number {
  return str.length * 2;
}

/** Returns total bytes used by all mitb cache keys */
function totalCacheBytes(): number {
  if (typeof localStorage === 'undefined') return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(KEY_PREFIX)) {
      total += estimateBytes(localStorage.getItem(k) ?? '');
    }
  }
  return total;
}

/** Evict the oldest/most-expired cache entries to free space */
function evictOldest(): void {
  if (typeof localStorage === 'undefined') return;
  const entries: Array<{ storageKey: string; expiresAt: number }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(KEY_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const entry: CacheEntry = JSON.parse(raw);
      entries.push({ storageKey: k, expiresAt: entry.expiresAt });
    } catch {
      // corrupt entry — remove it
      localStorage.removeItem(k!);
    }
  }

  // Sort by expiry ascending (oldest first)
  entries.sort((a, b) => a.expiresAt - b.expiresAt);

  // Remove the oldest 20%
  const removeCount = Math.max(1, Math.floor(entries.length * 0.2));
  for (let i = 0; i < removeCount; i++) {
    localStorage.removeItem(entries[i].storageKey);
    cacheLog('CACHE EVICTED', entries[i].storageKey, { reason: 'persistent quota' });
  }
}

export const persistentCache = {
  get<T>(namespace: string, key: string): CacheEntry<T> | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(storageKey(namespace, key));
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      // Hard-expire
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(storageKey(namespace, key));
        return null;
      }
      return entry;
    } catch {
      return null;
    }
  },

  set<T>(namespace: string, key: string, data: T, options: CacheOptions): void {
    if (typeof localStorage === 'undefined') return;
    const { ttl, staleTtl } = options;
    const now = Date.now();

    // Check namespace entry count
    const nsPrefix = `${KEY_PREFIX}${namespace}:`;
    let nsCount = 0;
    const nsKeys: Array<{ k: string; lastAccess: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(nsPrefix)) {
        nsCount++;
        try {
          const e: CacheEntry = JSON.parse(localStorage.getItem(k)!);
          nsKeys.push({ k: k!, lastAccess: e.lastAccessedAt });
        } catch {
          localStorage.removeItem(k!);
        }
      }
    }
    if (nsCount >= MAX_ENTRIES_PER_NS) {
      nsKeys.sort((a, b) => a.lastAccess - b.lastAccess);
      localStorage.removeItem(nsKeys[0].k);
      cacheLog('CACHE EVICTED', nsKeys[0].k, { reason: 'ns limit' });
    }

    // Check total size
    if (totalCacheBytes() > MAX_TOTAL_BYTES) {
      evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: now,
      updatedAt: now,
      staleAt: now + ttl,
      expiresAt:
        now +
        (staleTtl !== undefined
          ? staleTtl
          : ttl * STALE_MULTIPLIER),
      lastAccessedAt: now,
      version: (this.get<T>(namespace, key)?.version ?? 0) + 1,
      state: 'FRESH',
    };

    try {
      localStorage.setItem(storageKey(namespace, key), JSON.stringify(entry));
    } catch (e) {
      // QuotaExceededError — evict and retry once
      evictOldest();
      try {
        localStorage.setItem(storageKey(namespace, key), JSON.stringify(entry));
      } catch {
        // Give up silently — memory cache still works
      }
    }
  },

  delete(namespace: string, key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(storageKey(namespace, key));
    cacheLog('CACHE INVALIDATED', `${namespace}:${key}`, { layer: 'persistent' });
  },

  invalidateNamespace(namespace: string): void {
    if (typeof localStorage === 'undefined') return;
    const prefix = `${KEY_PREFIX}${namespace}:`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    if (toRemove.length > 0)
      cacheLog('CACHE INVALIDATED', namespace, {
        layer: 'persistent',
        entries: toRemove.length,
      });
  },

  /** Sweep expired entries. Call once on app startup. */
  gc(): void {
    if (typeof localStorage === 'undefined') return;
    const now = Date.now();
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(KEY_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(k);
        if (!raw) { toRemove.push(k!); continue; }
        const entry: CacheEntry = JSON.parse(raw);
        if (now > entry.expiresAt) toRemove.push(k!);
      } catch {
        toRemove.push(k!);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    if (toRemove.length > 0)
      cacheLog('CACHE EVICTED', 'gc sweep', { removed: toRemove.length });
  },
};
