'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CONSENT_EVENT,

  readConsent,
  resetConsent,
  syncGoogleConsentMode,
  writeConsent,
  type ConsentState,
} from '@/lib/consent';

interface ConsentContextValue {
  /** null until the visitor has made a choice. */
  consent: ConsentState | null;
  /** True once the stored decision has been read on the client. */
  isReady: boolean;
  analyticsAllowed: boolean;
  advertisingAllowed: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choice: { analytics: boolean; advertising: boolean }) => void;
  /** Opens the preferences dialog — wired to the footer "Cookie settings" link. */
  openPreferences: () => void;
  /** Clears the decision and shows the banner again. */
  withdraw: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within a ConsentProvider');
  return ctx;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  // The 'default' denial is already pushed by the inline script in <head>,
  // which is the only place it can run early enough to precede the AdSense
  // tag. All this does is replay a previously stored decision as an 'update'.
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setConsent(stored);
      syncGoogleConsentMode(stored);
    }
    setIsReady(true);
  }, []);

  // Keep multiple tabs / components in step.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState | null>).detail;
      setConsent(detail ?? null);
    };
    window.addEventListener(CONSENT_EVENT, handler);
    return () => window.removeEventListener(CONSENT_EVENT, handler);
  }, []);

  const save = useCallback(
    (choice: { analytics: boolean; advertising: boolean }) => {
      setConsent(writeConsent(choice));
      setPrefsOpen(false);
    },
    []
  );

  const acceptAll = useCallback(
    () => save({ analytics: true, advertising: true }),
    [save]
  );
  const rejectAll = useCallback(
    () => save({ analytics: false, advertising: false }),
    [save]
  );

  const withdraw = useCallback(() => {
    resetConsent();
    setConsent(null);
    setPrefsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      isReady,
      analyticsAllowed: consent?.analytics === true,
      advertisingAllowed: consent?.advertising === true,
      acceptAll,
      rejectAll,
      save,
      openPreferences: () => setPrefsOpen(true),
      withdraw,
    }),
    [consent, isReady, acceptAll, rejectAll, save, withdraw]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {isReady && !consent && <ConsentBanner />}
      <ConsentPreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
    </ConsentContext.Provider>
  );
}

// ── Banner ───────────────────────────────────────────────────────────────────

function ConsentBanner() {
  const { acceptAll, rejectAll, openPreferences } = useConsent();

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
      // Sits above the mobile bottom nav, which is z-50.
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="container mx-auto max-w-3xl px-4 py-4">
        <h2 id="consent-banner-title" className="text-sm font-semibold">
          Cookies and your choices
        </h2>
        <p
          id="consent-banner-description"
          className="mt-1 text-sm text-muted-foreground"
        >
          We need some storage to run the site — your session, theme, drafts and
          favorites. Beyond that we&apos;d like to measure visits and let Google
          personalise the ads it shows. You choose. Read our{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        {/* Accept and Reject are the same size and variant — neither is nudged. */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={acceptAll} className="w-full sm:w-auto sm:flex-1">
            Accept all
          </Button>
          <Button onClick={rejectAll} className="w-full sm:w-auto sm:flex-1">
            Reject all
          </Button>
          <Button
            variant="outline"
            onClick={openPreferences}
            className="w-full sm:w-auto"
          >
            Manage
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Preferences ──────────────────────────────────────────────────────────────

function ConsentPreferencesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { consent, save, withdraw } = useConsent();
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  // Re-seed the toggles from the stored decision each time the dialog opens.
  useEffect(() => {
    if (open) {
      setAnalytics(consent?.analytics ?? false);
      setAdvertising(consent?.advertising ?? false);
    }
  }, [open, consent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie settings</DialogTitle>
          <DialogDescription>
            Turn each category on or off. You can change this at any time from
            the &ldquo;Cookie settings&rdquo; link in the footer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 rounded-20px border p-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Strictly necessary</Label>
              <p className="text-xs text-muted-foreground">
                Your sign-in session, theme, unsent drafts, favorites, the send
                cooldown and the local cache. The site cannot work without
                these, so they cannot be switched off.
              </p>
            </div>
            <Switch checked disabled aria-label="Strictly necessary — always on" />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-20px border p-4">
            <div className="space-y-1">
              <Label htmlFor="consent-analytics" className="text-sm font-medium">
                Analytics
              </Label>
              <p className="text-xs text-muted-foreground">
                Records the country and city your visit came from, and Vercel
                Analytics page views. Helps us see which pages are worth
                keeping.
              </p>
            </div>
            <Switch
              id="consent-analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-20px border p-4">
            <div className="space-y-1">
              <Label
                htmlFor="consent-advertising"
                className="text-sm font-medium"
              >
                Personalised advertising
              </Label>
              <p className="text-xs text-muted-foreground">
                Lets Google use cookies to tailor ads to you and measure them.
                The site is free because it carries ads, so leaving this off
                does not remove them — you will simply see generic ones, chosen
                without any profile of you.
              </p>
            </div>
            <Switch
              id="consent-advertising"
              checked={advertising}
              onCheckedChange={setAdvertising}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {consent && (
            <Button
              variant="ghost"
              onClick={withdraw}
              className="w-full sm:w-auto"
            >
              Withdraw consent
            </Button>
          )}
          <Button
            onClick={() => save({ analytics, advertising })}
            className="w-full sm:w-auto"
          >
            Save choices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
