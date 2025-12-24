'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { type Message } from '@/lib/data';

interface MessageCache {
  [recipientName: string]: {
    messages: Message[];
    timestamp: number;
  };
}

interface MessageCacheContextType {
  getCachedMessages: (recipientName: string) => Promise<Message[] | undefined>;
  setCachedMessages: (recipientName: string, messages: Message[]) => void;
  getRecentlyViewed: () => string[];
}

const MessageCacheContext = createContext<MessageCacheContextType | undefined>(undefined);

const CACHE_KEY = 'messageCache';
const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const getInitialCache = (): MessageCache => {
    if (typeof window === 'undefined') return {};
    try {
        const storedCache = localStorage.getItem(CACHE_KEY);
        if (!storedCache) return {};
        const parsedCache: MessageCache = JSON.parse(storedCache);
        
        // Evict expired entries
        const now = Date.now();
        Object.keys(parsedCache).forEach(key => {
            if (now - parsedCache[key].timestamp > CACHE_EXPIRATION_MS) {
                delete parsedCache[key];
            }
        });
        return parsedCache;
    } catch (e) {
        console.error("Failed to load message cache from localStorage", e);
        return {};
    }
};

const getInitialRecentlyViewed = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export function MessageCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<MessageCache>(getInitialCache);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(getInitialRecentlyViewed);

  useEffect(() => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Failed to save message cache to localStorage", e);
    }
  }, [cache]);

  useEffect(() => {
    try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    } catch (e) {
        console.error("Failed to save recently viewed to localStorage", e);
    }
  }, [recentlyViewed]);

  const setCachedMessages = useCallback((recipientName: string, messages: Message[]) => {
    setCache(prevCache => ({
      ...prevCache,
      [recipientName]: { messages, timestamp: Date.now() },
    }));
    setRecentlyViewed(prev => {
        const newRecent = [recipientName, ...prev.filter(r => r !== recipientName)];
        return newRecent.slice(0, 5); // Keep only the last 5
    });
  }, []);

  const getCachedMessages = useCallback(async (recipientName: string): Promise<Message[] | undefined> => {
    const cachedEntry = cache[recipientName];
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_EXPIRATION_MS)) {
      return cachedEntry.messages;
    }
    return undefined;
  }, [cache]);

  const getRecentlyViewed = useCallback(() => {
    return recentlyViewed;
  }, [recentlyViewed]);

  const value = {
    getCachedMessages,
    setCachedMessages,
    getRecentlyViewed,
  };

  return (
    <MessageCacheContext.Provider value={value}>
      {children}
    </MessageCacheContext.Provider>
  );
}

export function useMessageCache() {
  const context = useContext(MessageCacheContext);
  if (context === undefined) {
    throw new Error('useMessageCache must be used within a MessageCacheProvider');
  }
  return context;
}
