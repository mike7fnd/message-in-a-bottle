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
 * Privacy choices, mirroring the web app's three-category consent manager.
 *
 * What each category actually controls here, so the UI can describe it
 * truthfully:
 *
 *   necessary    Firebase auth session, theme, favorites, the send cooldown
 *                and the read-through cache. Never gated.
 *   analytics    Currently nothing. The web records a country/city visit via
 *                its own endpoint; this app does not call it, so the toggle is
 *                reserved rather than pretending to switch something off.
 *   advertising  Whether AdMob may personalise ads. Ads themselves are not
 *                gated — same model as the web, where the AdSense tag always
 *                loads and Consent Mode decides personalisation. With this off,
 *                every request sets requestNonPersonalizedAdsOnly.
 *
 * Not a certified CMP: serving personalised ads to EEA/UK/Swiss users requires
 * Google's UMP SDK. Until that is wired up, personalisation defaults to off for
 * everyone, which is the conservative position.
 */
export interface ConsentState {
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
  version: number;
}

const CONSENT_VERSION = 1;
const STORAGE_KEY = 'miab_consent_v1';

interface ConsentContextValue {
  consent: ConsentState | null;
  /** True once the stored decision has been read. */
  isReady: boolean;
  analyticsAllowed: boolean;
  /** Drives requestNonPersonalizedAdsOnly across every ad unit. */
  personalisedAdsAllowed: boolean;
  save: (choice: { analytics: boolean; advertising: boolean }) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  withdraw: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as Partial<ConsentState>;
        // A decision recorded against an older category set is treated as no
        // decision, so people are asked again rather than silently carried over.
        if (parsed.version !== CONSENT_VERSION) return;
        if (
          typeof parsed.analytics !== 'boolean' ||
          typeof parsed.advertising !== 'boolean'
        )
          return;
        setConsent({
          analytics: parsed.analytics,
          advertising: parsed.advertising,
          decidedAt: parsed.decidedAt ?? new Date().toISOString(),
          version: CONSENT_VERSION,
        });
      })
      .catch(() => {
        /* unreadable — treat as undecided */
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    (choice: { analytics: boolean; advertising: boolean }) => {
      const next: ConsentState = {
        ...choice,
        decidedAt: new Date().toISOString(),
        version: CONSENT_VERSION,
      };
      setConsent(next);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        /* applies for this session even if it cannot be remembered */
      });
    },
    []
  );

  const withdraw = useCallback(() => {
    setConsent(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      isReady,
      analyticsAllowed: consent?.analytics === true,
      personalisedAdsAllowed: consent?.advertising === true,
      save,
      acceptAll: () => save({ analytics: true, advertising: true }),
      rejectAll: () => save({ analytics: false, advertising: false }),
      withdraw,
    }),
    [consent, isReady, save, withdraw]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within a ConsentProvider');
  return ctx;
}
