import React, { forwardRef } from 'react';
import { Image, View } from 'react-native';
import { AppText } from './ui';
import { siteConfig } from '../lib/site-config';
import { fonts } from '../theme/tokens';

/**
 * The 1080×1920 card people post to a story — the native twin of the web app's
 * ShareCard.
 *
 * Rendered off-screen and captured with react-native-view-shot. Dimensions are
 * half the final size and captured at 2×, which keeps the type sizes readable
 * in code while producing a full-resolution image.
 *
 * 9:16, not 16:9 — Instagram and TikTok stories are vertical, and a landscape
 * image posted to one is letterboxed into a thin strip.
 *
 * Colours are pinned rather than taken from the theme: otherwise a dark-mode
 * reader would export a different-looking image from everyone else.
 */
export const SHARE_CARD = {
  width: 540,
  height: 960,
  /** Passed to captureRef as `result: 'tmpfile'` scale. */
  pixelRatio: 2,
  background:
    'https://images.pexels.com/photos/19977233/pexels-photo-19977233.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920&fit=crop',
} as const;

const MAX_CHARS = 300;

export interface ShareCardProps {
  recipient: string;
  message: string;
  caption?: string;
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { recipient, message, caption = 'share your thoughts in your head' },
  ref
) {
  const body =
    message.length > MAX_CHARS
      ? `${message.slice(0, MAX_CHARS).trimEnd()}…`
      : message;

  const domain = siteConfig.apiBaseUrl.replace(/^https?:\/\//, '');

  return (
    <View
      ref={ref}
      collapsable={false} // required for view-shot to find a real native view
      style={{
        width: SHARE_CARD.width,
        height: SHARE_CARD.height,
        backgroundColor: '#0b1f2a',
        overflow: 'hidden',
      }}
    >
      <Image
        source={{ uri: SHARE_CARD.background }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      {/* Scrim, so white type stays legible over a bright horizon. */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(4,20,30,0.45)',
        }}
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 40,
          paddingVertical: 56,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText
          color="#ffffff"
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 15,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.9,
          }}
        >
          Message in a Bottle
        </AppText>

        <View
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderRadius: 28,
            padding: 30,
          }}
        >
          <AppText
            color="#111111"
            style={{
              fontFamily: fonts.body,
              fontSize: 19,
              textTransform: 'capitalize',
            }}
          >
            For{' '}
            <AppText
              color="#111111"
              style={{
                fontFamily: fonts.playfairItalic,
                fontStyle: 'italic',
                fontSize: 19,
              }}
            >
              {recipient}
            </AppText>
            ,
          </AppText>
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: 'rgba(0,0,0,0.14)',
              paddingLeft: 16,
              marginTop: 16,
            }}
          >
            <AppText
              color="#111111"
              style={{
                fontFamily: fonts.playfairItalic,
                fontStyle: 'italic',
                fontSize: 20,
                lineHeight: 31,
              }}
            >
              {body}
            </AppText>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <AppText
            color="#ffffff"
            style={{
              fontFamily: fonts.playfairItalic,
              fontStyle: 'italic',
              fontSize: 21,
              textAlign: 'center',
            }}
          >
            {caption}
          </AppText>
          <AppText
            color="#ffffff"
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 15,
              letterSpacing: 1,
              marginTop: 14,
              opacity: 0.95,
            }}
          >
            {domain}
          </AppText>
        </View>
      </View>
    </View>
  );
});
