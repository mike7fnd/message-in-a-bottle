import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Stale-while-revalidate cache, ported from the web app's src/lib/cache/.
 *
 * Same contract as the web version — memory tier in front of a persistent
 * tier, request de-duplication, serve-stale-then-refresh — with one structural
 * change: the web persists to localStorage, which is synchronous, while
 * AsyncStorage is not. Reads therefore await the persistent tier instead of
 * hitting it inline, and writes are fire-and-forget so a slow disk never blocks
 * a render.
 *
 * This matters more on a phone than in a browser: it is what makes the app
 * usable on a bad connection and cuts Firestore document reads, which are
 * billed per read.
 */

export const TTL = {
  /** Site content from the CMS endpoint. */
  STATIC: 24 * 60 * 60 * 1000,
  /** Reviews, featured tracks. */
  SEMI_STATIC: 30 * 60 * 1000,
  /** Browse recipient list. */
  MEDIUM: 5 * 60 * 1000,
  /** Messages within one bottle. */
  MESSAGE_LIST: 3 * 60 * 1000,
  /** A single message. */
  MESSAGE: 10 * 60 * 1000,
  /** Spotify search results. */
  SPOTIFY_SEARCH: 15 * 60 * 1000,
  /** The signed-in user's own sent messages. */
  USER_MESSAGES: 2 * 60 * 1000,
} as const;

/** An entry is STALE after 1× ttl and fully EXPIRED after 2×. */
const STALE_MULTIPLIER = 2;
const KEY_PREFIX = 'miab_cache:';

interface CacheEntry<T> {
  data: T;
  staleAt: number;
  expiresAt: number;
}

const memory = new Map<string, CacheEntry<unknown>>();
/** De-duplicates concurrent fetches for the same key. */
const inflight = new Map<string, Promise<unknown>>();

function storageKey(namespace: string, key: string) {
  return `${KEY_PREFIX}${namespace}:${key}`;
}

async function readPersistent<T>(
  namespace: string,
  key: string
): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(namespace, key));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() >= entry.expiresAt) return null;
    return entry;
  } catch {
    // Corrupt JSON or unavailable storage — treat as a miss.
    return null;
  }
}

function writePersistent<T>(
  namespace: string,
  key: string,
  entry: CacheEntry<T>
): void {
  AsyncStorage.setItem(storageKey(namespace, key), JSON.stringify(entry)).catch(
    () => {
      /* quota or unavailable — the memory tier still holds it */
    }
  );
}

export interface SmartFetchOptions<T> {
  namespace: string;
  key: string;
  ttl: number;
  fetcher: () => Promise<T>;
  /** Persist across app restarts. Leave false for anything user-specific. */
  persist?: boolean;
  /** Called when a background revalidation produces fresher data. */
  onFresh?: (data: T) => void;
  /** Skip every cache tier — for pull-to-refresh. */
  forceRefresh?: boolean;
}

export async function smartFetch<T>({
  namespace,
  key,
  ttl,
  fetcher,
  persist = false,
  onFresh,
  forceRefresh = false,
}: SmartFetchOptions<T>): Promise<T> {
  const id = `${namespace}:${key}`;
  const now = Date.now();

  const store = (data: T) => {
    const entry: CacheEntry<T> = {
      data,
      staleAt: now + ttl,
      expiresAt: now + ttl * STALE_MULTIPLIER,
    };
    memory.set(id, entry);
    if (persist) writePersistent(namespace, key, entry);
  };

  const run = async (): Promise<T> => {
    const existing = inflight.get(id);
    if (existing) return existing as Promise<T>;
    const p = fetcher()
      .then((data) => {
        store(data);
        return data;
      })
      .finally(() => {
        inflight.delete(id);
      });
    inflight.set(id, p);
    return p;
  };

  if (forceRefresh) return run();

  // ── Memory tier ────────────────────────────────────────────────────────────
  const mem = memory.get(id) as CacheEntry<T> | undefined;
  if (mem && now < mem.expiresAt) {
    if (now >= mem.staleAt) {
      // Serve stale, refresh behind the user's back.
      run()
        .then((fresh) => onFresh?.(fresh))
        .catch(() => {
          /* offline — the stale value stands */
        });
    }
    return mem.data;
  }

  // ── Persistent tier ────────────────────────────────────────────────────────
  if (persist) {
    const stored = await readPersistent<T>(namespace, key);
    if (stored) {
      memory.set(id, stored); // promote
      if (now >= stored.staleAt) {
        run()
          .then((fresh) => onFresh?.(fresh))
          .catch(() => {
            /* offline */
          });
      }
      return stored.data;
    }
  }

  return run();
}

export function invalidateKey(namespace: string, key: string): void {
  memory.delete(`${namespace}:${key}`);
  AsyncStorage.removeItem(storageKey(namespace, key)).catch(() => {});
}

export function invalidateNamespace(namespace: string): void {
  const prefix = `${namespace}:`;
  for (const k of Array.from(memory.keys())) {
    if (k.startsWith(prefix)) memory.delete(k);
  }
  AsyncStorage.getAllKeys()
    .then((keys) =>
      AsyncStorage.multiRemove(
        keys.filter((k) => k.startsWith(`${KEY_PREFIX}${prefix}`))
      )
    )
    .catch(() => {});
}

/** Drops every expired persistent entry. Call once on app start. */
export async function collectGarbage(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
      k.startsWith(KEY_PREFIX)
    );
    if (!keys.length) return;
    const pairs = await AsyncStorage.multiGet(keys);
    const dead = pairs
      .filter(([, raw]) => {
        if (!raw) return true;
        try {
          return Date.now() >= (JSON.parse(raw) as CacheEntry<unknown>).expiresAt;
        } catch {
          return true; // unparseable, drop it
        }
      })
      .map(([k]) => k);
    if (dead.length) await AsyncStorage.multiRemove(dead);
  } catch {
    /* non-critical */
  }
}
