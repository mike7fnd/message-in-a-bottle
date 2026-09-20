import React, { useState } from 'react';
import { View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  isAdsAvailable,
} from '../lib/ads';
import { useConsent } from '../context/ConsentContext';
import { AppText } from './ui';
import { spacing } from '../theme/tokens';

/**
 * AdMob banner — the native counterpart to the web app's AdSense AdUnit.
 *
 * Same rules as the web component, for the same policy reasons:
 *  - Renders nothing at all when ads are unavailable or no unit id is
 *    configured. No placeholder, no reserved box, no fake ad furniture.
 *  - Carries a visible "Advertisement" label.
 *  - Placed after content, never between tappable list items, so a tap on an
 *    ad can never be mistaken for a tap on the app.
 *  - Hides itself if the ad fails to load, rather than leaving an empty gap.
 *
 * In Expo Go the native module does not exist, so this renders nothing and the
 * app runs normally — see src/lib/ads.ts. In a dev build, Google's TestIds are
 * requested automatically: asking for live inventory from a debug build is what
 * gets an AdMob account suspended, so the test unit is the correct thing there.
 */
export interface AdBannerProps {
  unitId?: string;
  size?: string;
}

export function AdBanner({
  unitId,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: AdBannerProps) {
  const [failed, setFailed] = useState(false);
  const { personalisedAdsAllowed } = useConsent();

  const resolvedUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : unitId;

  // No native module (Expo Go), no unit configured, or the request failed.
  if (!isAdsAvailable || !BannerAd || !resolvedUnitId || failed) return null;

  const Banner = BannerAd;

  return (
    <View
      style={{ alignItems: 'center', marginVertical: spacing[6] }}
      accessibilityLabel="Advertisement"
    >
      <AppText
        variant="small"
        style={{
          marginBottom: spacing[1],
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontSize: 10,
        }}
      >
        Advertisement
      </AppText>
      <Banner
        unitId={resolvedUnitId}
        size={size}
        requestOptions={{
          // Personalisation is opt-in and defaults to off, matching the web
          // app's Consent Mode defaults. Changing the toggle in Settings takes
          // effect on the next request.
          requestNonPersonalizedAdsOnly: !personalisedAdsAllowed,
        }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
