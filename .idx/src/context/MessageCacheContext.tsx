
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { type Message } from '@/lib/data';

interface MessageCache {
  [recipientName: string]: Message[];
}

interface MessageCacheContextType {
  cache: MessageCache;
  getCachedMessages: (recipientName: string) => Message[] | undefined;
  setCachedMessages: (recipientName: string, messages: Message[]) => void;
}

const MessageCacheContext = createContext<MessageCacheContextType | undefined>(undefined);

export function MessageCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<MessageCache>({});

  const setCachedMessages = useCallback((recipientName: string, messages: Message[]) => {
    setCache(prevCache => ({
      ...prevCache,
      [recipientName]: messages,
    }));
  }, []);

  const getCachedMessages = useCallback((recipientName: string) => {
    return cache[recipientName];
  }, [cache]);

  const value = {
    cache,
    getCachedMessages,
    setCachedMessages,
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
