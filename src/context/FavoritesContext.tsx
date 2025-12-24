'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { type Message } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface FavoritesContextType {
  favorites: Message[];
  isFavorite: (messageId: string) => boolean;
  toggleFavorite: (message: Message) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_KEY = 'messageFavorites';

const getInitialFavorites = (): Message[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load favorites from localStorage", e);
    return [];
  }
};

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Message[]>(getInitialFavorites);
  const { toast } = useToast();
  const [lastAction, setLastAction] = useState<{ type: 'add' | 'remove'; timestamp: number } | null>(null);


  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
    
    // Fire toast notification based on the last action
    if (lastAction) {
        if (lastAction.type === 'add') {
            toast({ title: 'Added to Favorites' });
        } else {
            toast({ title: 'Removed from Favorites' });
        }
        // Reset last action to prevent re-firing on other updates
        setLastAction(null);
    }

  }, [favorites, toast, lastAction]);

  const toggleFavorite = useCallback((message: Message) => {
    const isCurrentlyFavorite = favorites.some(fav => fav.id === message.id);
    
    if (isCurrentlyFavorite) {
      setFavorites(prevFavorites => prevFavorites.filter(fav => fav.id !== message.id));
      setLastAction({ type: 'remove', timestamp: Date.now() });
    } else {
      setFavorites(prevFavorites => [message, ...prevFavorites]);
      setLastAction({ type: 'add', timestamp: Date.now() });
    }
  }, [favorites]);


  const isFavorite = useCallback((messageId: string) => {
    return favorites.some(fav => fav.id === messageId);
  }, [favorites]);

  const value = {
    favorites,
    isFavorite,
    toggleFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
