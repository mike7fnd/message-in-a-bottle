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
 * Collections — named sets of saved letters.
 *
 * Pinterest's boards, adapted. The heart on a card is the quick save (see
 * FavoritesContext); a collection is for deliberately grouping things you want
 * to come back to — "words I needed", "for later".
 *
 * Entirely local, like favorites. Two consequences worth knowing:
 *  - What a reader keeps is never recorded anywhere we can see. For an app
 *    built on anonymity that is the correct default, not a limitation.
 *  - The whole Message is stored, not just its id, so a collection opens
 *    instantly and works offline — and survives the original being deleted,
 *    which for a keepsake is a feature.
 */
const STORAGE_KEY = 'miab_collections_v1';

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
}

interface CollectionsContextValue {
  collections: Collection[];
  isReady: boolean;
  createCollection: (name: string) => string | null;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  addToCollection: (collectionId: string, message: Message) => void;
  removeFromCollection: (collectionId: string, messageId: string) => void;
  /** Every collection id that already holds this letter. */
  collectionsContaining: (messageId: string) => string[];
  /** Total saved letters across all collections, de-duplicated. */
  savedCount: number;
}

const CollectionsContext = createContext<CollectionsContextValue | undefined>(
  undefined
);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCollections(parsed as Collection[]);
      })
      .catch(() => {
        /* unreadable — start empty rather than crash */
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Collection[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      /* best effort */
    });
  }, []);

  const update = useCallback(
    (fn: (prev: Collection[]) => Collection[]) => {
      setCollections((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const createCollection = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const id = `c_${Date.now().toString(36)}`;
      update((prev) => [
        { id, name: trimmed, createdAt: Date.now(), messages: [] },
        ...prev,
      ]);
      return id;
    },
    [update]
  );

  const renameCollection = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      update((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
    },
    [update]
  );

  const deleteCollection = useCallback(
    (id: string) => update((prev) => prev.filter((c) => c.id !== id)),
    [update]
  );

  const addToCollection = useCallback(
    (collectionId: string, message: Message) => {
      update((prev) =>
        prev.map((c) => {
          if (c.id !== collectionId) return c;
          if (c.messages.some((m) => m.id === message.id)) return c; // no dupes
          return { ...c, messages: [message, ...c.messages] };
        })
      );
    },
    [update]
  );

  const removeFromCollection = useCallback(
    (collectionId: string, messageId: string) => {
      update((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
            : c
        )
      );
    },
    [update]
  );

  const savedCount = useMemo(() => {
    const ids = new Set<string>();
    collections.forEach((c) => c.messages.forEach((m) => ids.add(m.id)));
    return ids.size;
  }, [collections]);

  const value = useMemo<CollectionsContextValue>(
    () => ({
      collections,
      isReady,
      createCollection,
      renameCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
      collectionsContaining: (messageId: string) =>
        collections.filter((c) => c.messages.some((m) => m.id === messageId))
          .map((c) => c.id),
      savedCount,
    }),
    [
      collections,
      isReady,
      createCollection,
      renameCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
      savedCount,
    ]
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections(): CollectionsContextValue {
  const ctx = useContext(CollectionsContext);
  if (!ctx)
    throw new Error('useCollections must be used within a CollectionsProvider');
  return ctx;
}
