
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the shape of the accessibility settings
interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSizeLevel: number;
  dyslexiaFont: boolean;
  showImageDescriptions: boolean;
}

// Define the shape of the context, including the settings and their toggles
interface AccessibilityContextType extends AccessibilitySettings {
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
  setFontSizeLevel: (level: number) => void;
  toggleDyslexiaFont: () => void;
  toggleShowImageDescriptions: () => void;
  resetAccessibilitySettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Helper function to get a value from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const savedValue = localStorage.getItem(key);
  try {
    return savedValue ? JSON.parse(savedValue) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper function to set a value in localStorage
const setInStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const defaultSettings: AccessibilitySettings = {
    reduceMotion: false,
    highContrast: false,
    fontSizeLevel: 1,
    dyslexiaFont: false,
    showImageDescriptions: false,
};

// Provider component
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(() => getFromStorage<boolean>('reduceMotion', defaultSettings.reduceMotion));
  const [highContrast, setHighContrast] = useState(() => getFromStorage<boolean>('highContrast', defaultSettings.highContrast));
  const [fontSizeLevel, setFontSizeLevelState] = useState(() => getFromStorage<number>('fontSizeLevel', defaultSettings.fontSizeLevel));
  const [dyslexiaFont, setDyslexiaFont] = useState(() => getFromStorage<boolean>('dyslexiaFont', defaultSettings.dyslexiaFont));
  const [showImageDescriptions, setShowImageDescriptions] = useState(() => getFromStorage<boolean>('showImageDescriptions', defaultSettings.showImageDescriptions));

  // Effect to apply/remove classes from the HTML element based on state
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('reduced-motion', reduceMotion);
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('dyslexia-font', dyslexiaFont);
    
    // remove previous font size classes
    for (let i = 1; i <= 5; i++) {
        root.classList.remove(`font-size-${i}`);
    }
    // add current font size class
    if (fontSizeLevel > 1) {
        root.classList.add(`font-size-${fontSizeLevel}`);
    }

  }, [reduceMotion, highContrast, fontSizeLevel, dyslexiaFont]);

  // Memoized toggle/setter functions
  const toggleReduceMotion = useCallback(() => {
    setReduceMotion(prev => {
      const newValue = !prev;
      setInStorage('reduceMotion', newValue);
      return newValue;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const newValue = !prev;
      setInStorage('highContrast', newValue);
      return newValue;
    });
  }, []);

  const setFontSizeLevel = useCallback((level: number) => {
    const newLevel = Math.max(1, Math.min(5, level)); // Clamp between 1 and 5
    setFontSizeLevelState(newLevel);
    setInStorage('fontSizeLevel', newLevel);
  }, []);
  
  const toggleDyslexiaFont = useCallback(() => {
    setDyslexiaFont(prev => {
      const newValue = !prev;
      setInStorage('dyslexiaFont', newValue);
      return newValue;
    });
  }, []);

  const toggleShowImageDescriptions = useCallback(() => {
    setShowImageDescriptions(prev => {
      const newValue = !prev;
      setInStorage('showImageDescriptions', newValue);
      return newValue;
    });
  }, []);
  
  const resetAccessibilitySettings = useCallback(() => {
    setReduceMotion(defaultSettings.reduceMotion);
    setInStorage('reduceMotion', defaultSettings.reduceMotion);
    
    setHighContrast(defaultSettings.highContrast);
    setInStorage('highContrast', defaultSettings.highContrast);

    setFontSizeLevelState(defaultSettings.fontSizeLevel);
    setInStorage('fontSizeLevel', defaultSettings.fontSizeLevel);
    
    setDyslexiaFont(defaultSettings.dyslexiaFont);
    setInStorage('dyslexiaFont', defaultSettings.dyslexiaFont);

    setShowImageDescriptions(defaultSettings.showImageDescriptions);
    setInStorage('showImageDescriptions', defaultSettings.showImageDescriptions);
  }, []);


  const value = {
    reduceMotion,
    toggleReduceMotion,
    highContrast,
    toggleHighContrast,
    fontSizeLevel,
    setFontSizeLevel,
    dyslexiaFont,
    toggleDyslexiaFont,
    showImageDescriptions,
    toggleShowImageDescriptions,
    resetAccessibilitySettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Custom hook to use the accessibility context
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
