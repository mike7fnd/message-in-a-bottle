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
 * The search box on Home, and the history behind the second tab.
 *
 * Query lives here rather than in Home's local state because the history tab
 * has to be able to set it — tapping a past search should switch tabs and run
 * it. Passing that through router params across a tab boundary is fiddly and
 * fragile; a shared value is neither.
 *
 * History is local-only. What someone searched for is at least as revealing as
 * what they read, and this app does not record either.
 */
const HISTORY_KEY = 'miab_search_history';
const MAX_HISTORY = 20;

interface SearchContextValue {
  /** Live value of the search box on Home. */
  query: string;
  setQuery: (value: string) => void;
  history: string[];
  /** Commits a term to history. Called once a search actually returns. */
  remember: (term: string) => void;
  forget: (term: string) => void;
  clearHistory: () => void;
  isReady: boolean;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed as string[]);
      })
      .catch(() => {
        /* unreadable — start empty */
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {
      /* best effort */
    });
  }, []);

  const remember = useCallback(
    (term: string) => {
      const value = term.trim().toLowerCase();
      if (!value) return;
      setHistory((prev) => {
        // Already the most recent — nothing to reorder, and skipping the write
        // matters because this fires on every debounced keystroke.
        if (prev[0] === value) return prev;
        const next = [value, ...prev.filter((t) => t !== value)].slice(
          0,
          MAX_HISTORY
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const forget = useCallback(
    (term: string) => {
      setHistory((prev) => {
        const next = prev.filter((t) => t !== term);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    persist([]);
  }, [persist]);

  const value = useMemo<SearchContextValue>(
    () => ({
      query,
      setQuery,
      history,
      remember,
      forget,
      clearHistory,
      isReady,
    }),
    [query, history, remember, forget, clearHistory, isReady]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within a SearchProvider');
  return ctx;
}
