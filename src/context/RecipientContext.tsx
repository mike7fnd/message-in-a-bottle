
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { getRecipientsByFallback, type Recipient } from '@/lib/data';
import { useDebounce } from '@/hooks/use-debounce';

const BATCH_SIZE = 2; // Load 2 recipients at a time

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
  refreshRecipients: () => void;
}

const RecipientContext = createContext<RecipientContextType | undefined>(undefined);

export function RecipientProvider({ children }: { children: ReactNode }) {
  const [initialRecipients, setInitialRecipients] = useState<Recipient[]>([]);
  const [paginatedRecipients, setPaginatedRecipients] = useState<Recipient[]>([]);
  const [searchedRecipients, setSearchedRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Function to fetch recipients, either initial set or based on search
  const fetchRecipients = useCallback(async (term?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRecipients = await getRecipientsByFallback(term);
      if (term) {
        setSearchedRecipients(fetchedRecipients);
      } else {
        setInitialRecipients(fetchedRecipients);
        const initialBatch = fetchedRecipients.slice(0, BATCH_SIZE);
        setPaginatedRecipients(initialBatch);
        setHasMore(fetchedRecipients.length > BATCH_SIZE);
      }
    } catch (err) {
      setError('Failed to fetch recipient data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Expose a function to allow other components to trigger a refresh
  const refreshRecipients = useCallback(() => {
    fetchRecipients(debouncedSearchTerm);
  }, [fetchRecipients, debouncedSearchTerm]);


  // Initial data fetch
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Handle search logic
  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchRecipients(debouncedSearchTerm);
    } else {
      // Clear search results when search term is empty
      setSearchedRecipients([]);
    }
  }, [debouncedSearchTerm, fetchRecipients]);


  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || debouncedSearchTerm) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const currentLength = paginatedRecipients.length;
      const nextBatch = initialRecipients.slice(currentLength, currentLength + BATCH_SIZE);

      if (nextBatch.length > 0) {
          setPaginatedRecipients(prev => [...prev, ...nextBatch]);
      }

      setHasMore(currentLength + nextBatch.length < initialRecipients.length);
      setIsLoadingMore(false);
    }, 500);

  }, [isLoading, isLoadingMore, hasMore, initialRecipients, paginatedRecipients, debouncedSearchTerm]);


  const displayedRecipients = useMemo(() => {
    if (debouncedSearchTerm) {
      return searchedRecipients;
    }
    return paginatedRecipients;
  }, [debouncedSearchTerm, searchedRecipients, paginatedRecipients]);

  const value = {
    recipients: displayedRecipients,
    isLoading,
    isLoadingMore,
    hasMore: debouncedSearchTerm ? false : hasMore,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    scrollPosition,
    setScrollPosition,
    refreshRecipients,
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
