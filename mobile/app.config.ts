import type { ExpoConfig } from 'expo/config';

/**
 * Expo config as code, so the AdMob application ids can come from the
 * environment instead of being frozen into a committed JSON file.
 *
 * On the fallback values: `ca-app-pub-3940256099942544~...` are Google's own
 * published sample application ids, documented for exactly this purpose. They
 * are not invented and not a placeholder in the "fill this in later" sense —
 * they serve Google's test ads, so a build without real credentials still
 * compiles and runs correctly instead of crashing at startup, which is what a
 * zeroed id would do. Replace them via .env once your AdMob account exists.
 */

const ADMOB_ANDROID_APP_ID =
  process.env.ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_IOS_APP_ID =
  process.env.ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';

const config: ExpoConfig = {
  name: 'Message in a Bottle',
  slug: 'message-in-a-bottle',
  version: '0.1.0',
  // The web app is portrait-locked via the PWA manifest, but a native app that
  // refuses to rotate feels broken on a tablet, and the brief asks for both
  // orientations to be handled.
  orientation: 'default',
  scheme: 'miab',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.messageinabottle.dvbmike',
    infoPlist: {
      NSPhotoLibraryAddUsageDescription:
        'Save a message card to your photo library so you can post it to your story.',
      // Reading is a separate permission from saving. Needed for the profile
      // picture, which is copied into the app and never uploaded anywhere.
      NSPhotoLibraryUsageDescription:
        'Choose a profile picture. It is kept on this device only and is never uploaded.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    // Matches the existing Capacitor appId so this can replace that build
    // rather than becoming a second listing.
    package: 'com.messageinabottle.dvbmike',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-media-library',
      {
        savePhotosPermission:
          'Save a message card to your photos so you can share it.',
        isAccessMediaLocationEnabled: false,
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: ADMOB_ANDROID_APP_ID,
        iosAppId: ADMOB_IOS_APP_ID,
      },
    ],
  ],
  experiments: {
    // Disabled on purpose. On Windows, expo-router's typed-route generator
    // emits backslash paths into .expo/types/router.d.ts — entries like
    // `/(tabs)\browse`, and even `/..\src\lib\errors` from outside app/ —
    // which are invalid inside the template literal it writes them into. The
    // result is a router.d.ts that fails to parse, so `tsc --noEmit` reports a
    // dozen syntax errors in a generated file every time the dev server runs.
    //
    // The only thing lost is autocomplete on router.push() paths. Re-enable
    // once Expo normalises path separators, or if the project moves to a
    // POSIX-only workflow.
    typedRoutes: false,
  },
};

export default config;
