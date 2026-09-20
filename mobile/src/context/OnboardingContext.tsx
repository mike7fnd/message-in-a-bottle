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
 * Whether the concept has been explained on this device.
 *
 * The app no longer has a landing page — it opens straight into the feed — but
 * "your message is public and nobody is notified" is genuinely surprising and
 * still has to be said once. This is what makes it once.
 */
const STORAGE_KEY = 'miab_onboarded_v1';

interface OnboardingContextValue {
  hasOnboarded: boolean;
  /** False until the flag has been read; gates the redirect so it cannot flash. */
  isReady: boolean;
  complete: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (!cancelled && v === 'true') setHasOnboarded(true);
      })
      .catch(() => {
        // Unreadable storage: treat as onboarded rather than trapping someone
        // in an explainer they cannot dismiss.
        if (!cancelled) setHasOnboarded(true);
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(() => {
    setHasOnboarded(true);
    AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {
      /* they will see it once more next launch; not worth blocking on */
    });
  }, []);

  const value = useMemo(
    () => ({ hasOnboarded, isReady, complete }),
    [hasOnboarded, isReady, complete]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}
