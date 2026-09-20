import type { ComponentType } from 'react';

/**
 * Optional access to react-native-google-mobile-ads.
 *
 * Why this indirection exists: the library is a native module, so it does not
 * exist in Expo Go. A normal `import` of it is hoisted and evaluated at module
 * load, where `TurboModuleRegistry.getEnforcing('RNGoogleMobileAdsModule')`
 * throws — which killed evaluation of whatever file imported it. When that file
 * was the root layout, the entire provider tree failed to mount and every
 * screen then died with a misleading "useTheme must be used within a
 * ThemeProvider", because the only ThemeProvider left in the tree was React
 * Navigation's.
 *
 * `require` inside a try/catch defers the lookup to runtime and contains the
 * failure, so the app runs fully in Expo Go with ads simply absent. In a custom
 * dev build the require succeeds and ads work normally. No behaviour is faked
 * either way: ads are either real or not there.
 */

interface AdsModule {
  default: () => { initialize: () => Promise<unknown> };
  BannerAd: ComponentType<Record<string, unknown>>;
  BannerAdSize: Record<string, string>;
  TestIds: Record<string, string>;
}

let adsModule: AdsModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  adsModule = require('react-native-google-mobile-ads') as AdsModule;
} catch {
  adsModule = null;
}

/** True only in a build where the native ads module is actually linked. */
export const isAdsAvailable = adsModule !== null;

export const BannerAd = adsModule?.BannerAd ?? null;

/**
 * Sizes. Falls back to the string constants the library itself uses, so call
 * sites can name a size without having to check availability first.
 */
export const BannerAdSize = adsModule?.BannerAdSize ?? {
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
};

/** Google's published test unit ids, used automatically in dev builds. */
export const TestIds = adsModule?.TestIds ?? {
  ADAPTIVE_BANNER: '',
  BANNER: '',
};

/**
 * Initialises the ads SDK when it is present. Always resolves — ad setup must
 * never be able to block or crash app startup.
 */
export async function initializeAds(): Promise<void> {
  if (!adsModule) return;
  try {
    await adsModule.default().initialize();
  } catch {
    /* SDK failed to start; the app is fully usable without it */
  }
}
