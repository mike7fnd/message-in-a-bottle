/**
 * Cookie / storage consent state.
 *
 * Scope of what this actually controls, so the UI can describe it truthfully:
 *
 *   necessary    Firebase Authentication session storage (including the
 *                anonymous sign-in every visitor gets), the theme preference,
 *                message drafts, favorites, the send cooldown, and the
 *                read-through cache. These are required for the site to work
 *                and are never gated.
 *   analytics    The country/city visit record written to Firestore via
 *                /api/track-visit, and Vercel Analytics.
 *   advertising  The Google AdSense script and any ad unit.
 *
 * Nothing in the analytics or advertising categories loads before the visitor
 * makes a choice.
 *
 * Note on the EEA/UK/Switzerland: Google requires a Google-certified CMP
 * integrated with the IAB TCF to serve personalized ads to those visitors. This
 * module is not a certified CMP and does not emit a TC string. It denies ad
 * storage by default and reports consent through Google Consent Mode v2, which
 * is what a first-party control can legitimately do. Enabling Google's own
 * Privacy & Messaging GDPR message in the AdSense console is still required —
 * see ADSENSE-READINESS.md.
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising';

export interface ConsentState {
  analytics: boolean;
  advertising: boolean;
  /** ISO timestamp of the decision. */
  decidedAt: string;
  /** Bumped when the categories change meaning, which re-prompts everyone. */
  version: number;
}

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = 'miab_consent_v1';
export const CONSENT_EVENT = 'miab:consent-change';

/** No decision yet — everything optional is off. */
export const CONSENT_DENIED: Omit<ConsentState, 'decidedAt'> = {
  analytics: false,
  advertising: false,
  version: CONSENT_VERSION,
};

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    // A stored decision from an older category set is treated as no decision.
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== 'boolean') return null;
    if (typeof parsed.advertising !== 'boolean') return null;
    return {
      analytics: parsed.analytics,
      advertising: parsed.advertising,
      decidedAt: parsed.decidedAt ?? new Date().toISOString(),
      version: CONSENT_VERSION,
    };
  } catch {
    // Private mode, blocked storage, or corrupt JSON — treat as undecided.
    return null;
  }
}

export function writeConsent(choice: {
  analytics: boolean;
  advertising: boolean;
}): ConsentState {
  const state: ConsentState = {
    analytics: choice.analytics,
    advertising: choice.advertising,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable. The choice still applies for this page view via the
    // event below; it simply will not be remembered.
  }
  syncGoogleConsentMode(state);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

/** Clears the stored decision so the banner appears again. */
export function resetConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

// ── Google Consent Mode v2 ───────────────────────────────────────────────────

type GtagArgs = unknown[];

function gtag(...args: GtagArgs) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: GtagArgs[] };
  w.dataLayer = w.dataLayer || [];
  // Consent Mode requires the raw `arguments` object shape, not a flat array.
  w.dataLayer.push(args);
}

/**
 * Must run before any Google tag loads. Denies everything until the visitor
 * chooses, which is the required default outside of an explicit opt-in.
 */
export function initGoogleConsentMode(): void {
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
}

export function syncGoogleConsentMode(state: ConsentState): void {
  const ad = state.advertising ? 'granted' : 'denied';
  gtag('consent', 'update', {
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
    analytics_storage: state.analytics ? 'granted' : 'denied',
  });
}
