import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Followed bottles, and the local signals that feed "For you".
 *
 * The important design point: you follow a **name**, not a person. There are no
 * user accounts to follow here — everyone is anonymous, and that is the whole
 * premise — but "show me new messages written to Sam" is perfectly coherent and
 * gives the app a personal feed without a social graph, without server-side
 * profiles, and without anything leaving the device.
 *
 * Everything is local. No Firestore reads, no writes, and nothing about a
 * reader's interests is recorded anywhere we could see it.
 */

const FOLLOWS_KEY = 'miab_follows';
const VIEWED_KEY = 'miab_recently_viewed';
const SENT_KEY = 'miab_sent_to';

/** Keeps the local history bounded; only the most recent matter for ranking. */
const MAX_VIEWED = 30;
const MAX_SENT = 30;

function normalise(name: string) {
  return name.toLowerCase().trim();
}

async function readList(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {
    /* best effort — the in-memory value still applies this session */
  });
}

interface FollowsContextValue {
  follows: string[];
  /** Most-recently-opened bottle names, newest first. */
  recentlyViewed: string[];
  /** Names this device has sent to, newest first. */
  sentTo: string[];
  isFollowing: (name: string) => boolean;
  toggleFollow: (name: string) => void;
  noteViewed: (name: string) => void;
  noteSentTo: (name: string) => void;
  /**
   * Ranked names for the "For you" feed: follows first, then people you have
   * written to, then bottles you have opened. Capped to Firestore's `in` limit.
   */
  personalNames: string[];
  isReady: boolean;
}

const FollowsContext = createContext<FollowsContextValue | undefined>(undefined);

export function FollowsProvider({ children }: { children: ReactNode }) {
  const [follows, setFollows] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [sentTo, setSentTo] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      readList(FOLLOWS_KEY),
      readList(VIEWED_KEY),
      readList(SENT_KEY),
    ])
      .then(([f, v, s]) => {
        if (cancelled) return;
        setFollows(f);
        setRecentlyViewed(v);
        setSentTo(s);
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFollow = useCallback((name: string) => {
    const key = normalise(name);
    if (!key) return;
    setFollows((prev) => {
      const next = prev.includes(key)
        ? prev.filter((n) => n !== key)
        : [key, ...prev];
      writeList(FOLLOWS_KEY, next);
      return next;
    });
  }, []);

  /** Moves `name` to the front of a capped most-recent list. */
  const pushRecent = useCallback(
    (
      name: string,
      setter: React.Dispatch<React.SetStateAction<string[]>>,
      key: string,
      max: number
    ) => {
      const value = normalise(name);
      if (!value) return;
      setter((prev) => {
        if (prev[0] === value) return prev; // already newest, avoid a write
        const next = [value, ...prev.filter((n) => n !== value)].slice(0, max);
        writeList(key, next);
        return next;
      });
    },
    []
  );

  const noteViewed = useCallback(
    (name: string) => pushRecent(name, setRecentlyViewed, VIEWED_KEY, MAX_VIEWED),
    [pushRecent]
  );

  const noteSentTo = useCallback(
    (name: string) => pushRecent(name, setSentTo, SENT_KEY, MAX_SENT),
    [pushRecent]
  );

  const personalNames = useMemo(() => {
    // Order matters: it decides who survives the 30-name cap on the `in`
    // filter. An explicit follow outranks a bottle you happened to open once.
    const seen = new Set<string>();
    const ranked: string[] = [];
    for (const name of [...follows, ...sentTo, ...recentlyViewed]) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      ranked.push(name);
    }
    return ranked.slice(0, 30);
  }, [follows, sentTo, recentlyViewed]);

  const value = useMemo<FollowsContextValue>(
    () => ({
      follows,
      recentlyViewed,
      sentTo,
      isReady,
      isFollowing: (name: string) => follows.includes(normalise(name)),
      toggleFollow,
      noteViewed,
      noteSentTo,
      personalNames,
    }),
    [
      follows,
      recentlyViewed,
      sentTo,
      isReady,
      toggleFollow,
      noteViewed,
      noteSentTo,
      personalNames,
    ]
  );

  return (
    <FollowsContext.Provider value={value}>{children}</FollowsContext.Provider>
  );
}

export function useFollows(): FollowsContextValue {
  const ctx = useContext(FollowsContext);
  if (!ctx) throw new Error('useFollows must be used within a FollowsProvider');
  return ctx;
}
