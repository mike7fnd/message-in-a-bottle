/**
 * Cache debug logger.
 * In development: logs cache events to console with colored prefixes.
 * In production: silent (tree-shaken out if process.env is inlined).
 */

const IS_DEV = process.env.NODE_ENV === 'development';

type CacheEvent =
  | 'CACHE HIT'
  | 'CACHE MISS'
  | 'STALE → REVALIDATING'
  | 'REQUEST DEDUPED'
  | 'PREFETCH'
  | 'CACHE INVALIDATED'
  | 'CACHE EVICTED'
  | 'CACHE SET'
  | 'CACHE ERROR'
  | 'OFFLINE HIT';

const COLORS: Record<CacheEvent, string> = {
  'CACHE HIT': '#22c55e', // green
  'CACHE MISS': '#f97316', // orange
  'STALE → REVALIDATING': '#a78bfa', // purple
  'REQUEST DEDUPED': '#38bdf8', // sky
  'PREFETCH': '#fb923c', // amber
  'CACHE INVALIDATED': '#f43f5e', // rose
  'CACHE EVICTED': '#94a3b8', // slate
  'CACHE SET': '#60a5fa', // blue
  'CACHE ERROR': '#ef4444', // red
  'OFFLINE HIT': '#facc15', // yellow
};

export function cacheLog(event: CacheEvent, key: string, detail?: unknown): void {
  if (!IS_DEV) return;

  const color = COLORS[event] ?? '#94a3b8';
  const msg = `%c[Cache] ${event}%c ${key}`;

  if (detail !== undefined) {
    console.groupCollapsed(
      msg,
      `color:${color};font-weight:bold`,
      'color:inherit;font-weight:normal',
    );
    console.log(detail);
    console.groupEnd();
  } else {
    console.log(
      msg,
      `color:${color};font-weight:bold`,
      'color:inherit;font-weight:normal',
    );
  }
}
