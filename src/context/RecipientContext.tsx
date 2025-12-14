
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { getRecipientsByFallback, type Recipient } from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';

const BATCH_SIZE = 8; // Load 8 recipients at a time

interface RecipientContextType {
  recipients: Recipient[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
}

const RecipientContext = createContext<RecipientContextType | undefined>(undefined);

export function RecipientProvider({ children }: { children: ReactNode }) {
  const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
  const [paginatedRecipients, setPaginatedRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // This is the single source of truth for fetching recipients now.
  const fetchAllRecipients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Always build the list from the ground truth: the messages themselves.
      const fallbackRecipients = await getRecipientsByFallback();
      setAllRecipients(fallbackRecipients); 
      
      const initialBatch = fallbackRecipients.slice(0, BATCH_SIZE);
      setPaginatedRecipients(initialBatch);
      setHasMore(fallbackRecipients.length > BATCH_SIZE);

    } catch (err) {
      setError('Failed to fetch recipient data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore || debouncedSearchTerm) return;

    const currentLength = paginatedRecipients.length;
    const nextBatch = allRecipients.slice(currentLength, currentLength + BATCH_SIZE);
    
    if (nextBatch.length > 0) {
        setPaginatedRecipients(prev => [...prev, ...nextBatch]);
    }
    
    setHasMore(currentLength + nextBatch.length < allRecipients.length);

  }, [isLoading, hasMore, allRecipients, paginatedRecipients, debouncedSearchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchAllRecipients();
  }, [fetchAllRecipients]);

  const displayedRecipients = useMemo(() => {
    if (debouncedSearchTerm) {
      return allRecipients.filter(recipient =>
        recipient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    return paginatedRecipients;
  }, [debouncedSearchTerm, allRecipients, paginatedRecipients]);
  
  const value = {
    recipients: displayedRecipients,
    isLoading: isLoading && paginatedRecipients.length === 0,
    isLoadingMore: false, // Simplified, as we paginate from a full client-side list
    hasMore: debouncedSearchTerm ? false : hasMore,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    scrollPosition,
    setScrollPosition,
  };

  return (
    <RecipientContext.Provider value={value}>
      {children}
    </RecipientContext.Provider>
  );
}

export function useRecipientContext() {
  const context = useContext(RecipientContext);
  if (context === undefined) {
    throw new Error('useRecipientContext must be used within a RecipientProvider');
  }
  return context;
}
