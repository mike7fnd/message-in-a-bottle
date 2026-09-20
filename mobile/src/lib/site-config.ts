/**
 * Mobile counterpart to the web's src/lib/site-config.ts.
 *
 * Values come from Expo's EXPO_PUBLIC_* environment variables, which are
 * inlined at build time. Defaults mirror production so a fresh clone runs
 * against the live backend without a .env — the same reasoning as the web app,
 * where an unset variable must not silently break a working deployment.
 */

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export const siteConfig = {
  name: 'Message in a Bottle',
  /**
   * The deployed web app. Mobile calls its API routes rather than duplicating
   * that logic: /api/content for the CMS copy, /api/spotify/* for search.
   */
  apiBaseUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_SITE_URL || 'https://messageinabottle.sbs'
  ),
  operator: 'Mike Fernandez',
  contactEmail: 'mikefernandex227@gmail.com',
  donateUrl: 'https://paypal.me/MikeFernandez255',
  social: {
    tiktok: 'https://www.tiktok.com/@dvbmke',
    instagram: 'https://www.instagram.com/dvbmike',
  },
} as const;

// ── Firebase ─────────────────────────────────────────────────────────────────
// These are the same public client credentials the web bundle ships; Firebase
// web API keys identify a project, they do not authorise anything on their own.
// Access is controlled by the Firestore security rules.

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

/** Web OAuth client id, required by @react-native-google-signin. */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;

export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

// ── AdMob ────────────────────────────────────────────────────────────────────

/**
 * Ad unit ids. Unset means the unit renders nothing at all — no container, no
 * placeholder — exactly like the web AdUnit component.
 *
 * In development the library serves Google's test ads automatically, so no
 * real inventory is ever requested from a debug build.
 */
export const AD_UNITS = {
  browseFeed: process.env.EXPO_PUBLIC_ADMOB_UNIT_BROWSE?.trim() || undefined,
  messageBelow: process.env.EXPO_PUBLIC_ADMOB_UNIT_MESSAGE?.trim() || undefined,
} as const;
