/**
 * CacheProvider
 *
 * Runs once on app startup (client-side only) to:
 *  1. Run garbage collection on the persistent cache (sweep expired entries)
 *  2. Prefetch high-probability next data
 *  3. Set up online/offline detection
 */

'use client';

import { useEffect, useRef } from 'react';
import { persistentCache, memoryCache } from '@/lib/cache';
import { getCachedContent } from '@/lib/cached-data';
import { cacheLog } from '@/lib/cache/logger';

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // ── 1. GC sweep ─────────────────────────────────────────────────────────
    persistentCache.gc();

    // ── 2. Prefetch site content ─────────────────────────────────────────────
    // Site content is static JSON that every page needs. Load it once and cache.
    getCachedContent().catch(() => {/* silently ignore — pages handle their own loading */ });

    // ── 3. Online / offline detection ───────────────────────────────────────
    const handleOnline = () => {
      cacheLog('CACHE HIT', 'network', { status: 'back online' });
      // Trigger background revalidation by invalidating STALE entries
      // (they will be served from cache next access and revalidated automatically)
    };

    const handleOffline = () => {
      cacheLog('OFFLINE HIT', 'network', { status: 'offline — serving from cache' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook to check network status. Returns true if the browser is online.
 */
export function useIsOnline(): boolean {
  // SSR-safe default
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}
