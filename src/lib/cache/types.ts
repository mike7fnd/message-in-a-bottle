/**
 * Smart Cache — Type definitions
 *
 * Cache states:
 *  FRESH        → data is valid, use directly
 *  STALE        → data is past staleAt but before expiresAt, serve + revalidate in background
 *  EXPIRED      → data is past expiresAt, must refetch before serving
 *  MISSING      → key not in cache
 *  FETCHING     → a request is in-flight (dedup guard)
 *  ERROR        → last fetch resulted in an error
 */

export type CacheState =
  | 'FRESH'
  | 'STALE'
  | 'EXPIRED'
  | 'MISSING'
  | 'FETCHING'
  | 'ERROR';

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  createdAt: number;
  updatedAt: number;
  /** Milliseconds since epoch when the entry becomes stale (SWR kicks in) */
  staleAt: number;
  /** Milliseconds since epoch when the entry is fully expired and must be refetched */
  expiresAt: number;
  lastAccessedAt: number;
  version: number;
  state: CacheState;
  /** Approximate byte size (used for memory management) */
  byteSize?: number;
}

export interface CacheOptions {
  /** How long data is FRESH (ms). Defaults differ per data type. */
  ttl: number;
  /** How long after fresh window before entry expires entirely. Defaults to ttl * 2. */
  staleTtl?: number;
  /** Whether to persist to localStorage */
  persist?: boolean;
  /** Maximum entries in this namespace */
  maxEntries?: number;
  /** Tag for bulk invalidation */
  tags?: string[];
}

export interface FetchResult<T> {
  data: T;
  cacheState: CacheState;
  fromCache: boolean;
}

// ── TTL presets (milliseconds) ────────────────────────────────────────────────

export const TTL = {
  /** Immutable content — site config read from JSON file */
  STATIC: 24 * 60 * 60 * 1000,           // 24 hours
  /** Reviews, featured Spotify tracks — changes rarely */
  SEMI_STATIC: 30 * 60 * 1000,           // 30 minutes
  /** Browse recipients derived from messages */
  MEDIUM: 5 * 60 * 1000,                 // 5 minutes
  /** Individual messages for a recipient */
  MESSAGE_LIST: 3 * 60 * 1000,           // 3 minutes
  /** Single message by id */
  MESSAGE: 10 * 60 * 1000,               // 10 minutes
  /** Spotify search results — per query */
  SPOTIFY_SEARCH: 15 * 60 * 1000,        // 15 minutes
  /** User-specific sent messages */
  USER_MESSAGES: 2 * 60 * 1000,          // 2 minutes
  /** Never cache (write operations etc.) */
  NONE: 0,
} as const;

// Stale multiplier — entry becomes STALE after 1× TTL, EXPIRED after 2× TTL
export const STALE_MULTIPLIER = 2;
