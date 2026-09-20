import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Message } from '../lib/data';

/**
 * The queue behind the full-screen reader.
 *
 * The reader is a separate route, and expo-router params are strings — you
 * cannot hand a screen an array of messages through a URL. So whichever list
 * the reader was opened from (the feed, a bottle, a collection) drops its
 * items here first, and the reader picks them up.
 *
 * Holding the queue in memory rather than re-querying also means opening the
 * reader costs zero Firestore reads: every letter you swipe through has
 * already been paid for by the list you came from.
 */
interface ReaderContextValue {
  queue: Message[];
  startIndex: number;
  /** Populate the queue and choose where to start. */
  openReader: (messages: Message[], index: number) => void;
  clear: () => void;
}

const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Message[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  const openReader = useCallback((messages: Message[], index: number) => {
    setQueue(messages);
    setStartIndex(Math.max(0, Math.min(index, messages.length - 1)));
  }, []);

  // Not called on close: keeping the queue means backing out and reopening is
  // instant. It is replaced wholesale on the next openReader.
  const clear = useCallback(() => setQueue([]), []);

  const value = useMemo(
    () => ({ queue, startIndex, openReader, clear }),
    [queue, startIndex, openReader, clear]
  );

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}

export function useReader(): ReaderContextValue {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader must be used within a ReaderProvider');
  return ctx;
}
