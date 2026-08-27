/**
 * Public API for the smart cache system.
 *
 * Import from here, not from individual files.
 */

export { memoryCache } from './memory-cache';
export { persistentCache } from './persistent-cache';
export {
  smartFetch,
  invalidateKey,
  invalidateNamespace,
  invalidateMany,
} from './smart-fetch';
export { cacheLog } from './logger';
export { TTL, STALE_MULTIPLIER } from './types';
export type {
  CacheEntry,
  CacheOptions,
  CacheState,
  FetchResult,
} from './types';
