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
import type { Message } from '../lib/data';

/**
 * Favorited messages, stored on the device only.
 *
 * Same as the web app: favorites never leave the phone and are never written
 * to Firestore, so there is nothing to sync and nothing about a reader's
 * interests is recorded server-side. The trade-off is the same too — clearing
 * app data loses them.
 */
const STORAGE_KEY = 'miab_favorites';

interface FavoritesContextValue {
  favorites: Message[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (message: Message) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) setFavorites(parsed);
      })
      .catch(() => {
        /* unreadable — start empty rather than crash */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Message[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      /* best effort */
    });
  }, []);

  const toggleFavorite = useCallback(
    (message: Message) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === message.id);
        const next = exists
          ? prev.filter((f) => f.id !== message.id)
          : [message, ...prev];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoading,
      isFavorite: (id: string) => favorites.some((f) => f.id === id),
      toggleFavorite,
    }),
    [favorites, isLoading, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
