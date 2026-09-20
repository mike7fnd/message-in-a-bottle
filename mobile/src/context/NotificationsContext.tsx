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
import { smartFetch, TTL } from '../lib/cache';
import { getFeedPageForNames, type Message } from '../lib/data';
import { useFollows } from './FollowsContext';

/**
 * New letters written to the bottles you follow.
 *
 * There is no push infrastructure and no server-side notification store — this
 * is derived entirely from data already in Firestore plus one local timestamp.
 * Following a name is a local choice, so the only thing needed to turn it into
 * a notification is "has anything been written to this name since I last
 * looked".
 *
 * Read cost is the reason for the shape of this:
 *  - With no follows it never queries at all.
 *  - One `in` query covers every followed name rather than one query per name.
 *  - Results run through smartFetch on a short TTL, so opening the app four
 *    times in ten minutes costs one query, not four.
 *
 * NOTE: that query combines `where('recipient','in', …)` with
 * `orderBy('timestamp')`, which needs a composite index on
 * `recipient ASC, timestamp DESC`. Firestore returns a failed-precondition
 * error with a one-click creation link the first time it runs.
 */
const SEEN_KEY = 'miab_notifications_seen_at';

/** How many recent letters to consider. Beyond this it stops being a notification. */
const SCAN_LIMIT = 30;

interface NotificationsContextValue {
  items: Message[];
  /** Letters newer than the last time the screen was opened. */
  unseenCount: number;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  markAllSeen: () => void;
  isUnseen: (message: Message) => boolean;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { follows, isReady: followsReady } = useFollows();

  const [items, setItems] = useState<Message[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SEEN_KEY)
      .then((raw) => {
        if (cancelled) return;
        const parsed = raw ? Number(raw) : NaN;
        if (Number.isFinite(parsed)) {
          setLastSeenAt(parsed);
          return;
        }
        // First run: start the clock now. Without this, every letter ever
        // written to a name you just followed would arrive as "new".
        const now = Date.now();
        setLastSeenAt(now);
        AsyncStorage.setItem(SEEN_KEY, String(now)).catch(() => {});
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(
    async (force = false) => {
      if (follows.length === 0) {
        setItems([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const page = await smartFetch({
          namespace: 'notifications',
          // Keyed by the follow set, so following someone new refetches rather
          // than serving a cached list that cannot contain them.
          key: [...follows].sort().join(','),
          ttl: TTL.MESSAGE_LIST,
          persist: false,
          forceRefresh: force,
          fetcher: () => getFeedPageForNames(follows, null, SCAN_LIMIT),
        });
        setItems(page.messages);
      } catch (e) {
        console.error('Notifications failed:', e);
        setError('Could not check for new letters.');
      } finally {
        setIsLoading(false);
      }
    },
    [follows]
  );

  // Refresh whenever the follow set changes, including on first load.
  useEffect(() => {
    if (!followsReady) return;
    refresh();
  }, [followsReady, refresh]);

  const markAllSeen = useCallback(() => {
    const now = Date.now();
    setLastSeenAt(now);
    AsyncStorage.setItem(SEEN_KEY, String(now)).catch(() => {});
  }, []);

  const isUnseen = useCallback(
    (message: Message) =>
      lastSeenAt !== null &&
      message.timestamp !== null &&
      message.timestamp.getTime() > lastSeenAt,
    [lastSeenAt]
  );

  const unseenCount = useMemo(
    () => items.filter(isUnseen).length,
    [items, isUnseen]
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unseenCount,
      isLoading,
      isReady,
      error,
      refresh,
      markAllSeen,
      isUnseen,
    }),
    [items, unseenCount, isLoading, isReady, error, refresh, markAllSeen, isUnseen]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  return ctx;
}
