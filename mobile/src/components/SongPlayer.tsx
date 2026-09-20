import { Music } from 'lucide-react-native';
import React, { memo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText, Button } from './ui';

/**
 * The Spotify embed for a letter's attached song.
 *
 * ── On autoplay ──
 *
 * `mediaPlaybackRequiresUserAction={false}` removes the *platform's* block on
 * sound starting without a tap, which is the part we control. Whether the track
 * then actually starts is Spotify's decision inside the embed, and it is not
 * something this app can force: the embed serves a 30-second preview to signed
 * out listeners and frequently waits for a press regardless. So the player is
 * built to look right either way — it appears already open and ready, and if
 * Spotify waits, one tap on its own play button starts it.
 *
 * Nothing here is claimed as guaranteed, because it cannot be. What is
 * guaranteed is the part that matters for privacy: the WebView is only mounted
 * when `active` is true.
 *
 * ── Why `active` exists ──
 *
 * In the reader this sits inside a swipeable pager. Unmounting the WebView is
 * what stops the audio when you swipe to the next letter — without it you would
 * accumulate players, all of them playing at once. It also means no request
 * reaches Spotify for letters you scrolled past but never stopped on.
 */
export interface SongPlayerProps {
  trackId: string;
  /**
   * Mount the player. False unmounts it, which stops playback.
   * Screens that are not a pager can simply pass true.
   */
  active?: boolean;
  /** Start playing as soon as it mounts, as far as the platform allows. */
  autoplay?: boolean;
  /** Shown instead of the player until pressed. Used on shared-link pages. */
  requireTap?: boolean;
  onRequestLoad?: () => void;
}

const PLAYER_HEIGHT = 152;

function SongPlayerBase({
  trackId,
  active = true,
  autoplay = false,
  requireTap = false,
  onRequestLoad,
}: SongPlayerProps) {
  const { colors } = useTheme();

  if (requireTap) {
    return (
      <View
        style={{
          borderRadius: radius.container,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing[4],
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.container,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Music size={18} color={colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body">A song is attached</AppText>
            <AppText variant="small">
              Loading the player connects you to Spotify.
            </AppText>
          </View>
        </View>
        <Button
          title="Load Spotify player"
          variant="outline"
          onPress={onRequestLoad}
          fullWidth
          style={{ marginTop: spacing[3] }}
        />
      </View>
    );
  }

  // Unmounted rather than hidden. A hidden WebView keeps playing.
  if (!active) return null;

  return (
    <View
      style={{
        height: PLAYER_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.muted,
      }}
    >
      <WebView
        source={{
          uri: `https://open.spotify.com/embed/track/${encodeURIComponent(
            trackId
          )}?utm_source=generator${autoplay ? '&autoplay=1' : ''}`,
        }}
        allowsInlineMediaPlayback
        // The platform-level gesture requirement. Left on when we are not
        // trying to autoplay, so a letter without this feature behaves the way
        // a web page would.
        mediaPlaybackRequiresUserAction={!autoplay}
        // The embed paints its own background; a transparent WebView over the
        // muted colour above avoids a white flash while it loads in dark mode.
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        // It is a player, not a page — nothing inside should be able to
        // navigate the WebView somewhere else.
        setSupportMultipleWindows={false}
        accessibilityLabel="Spotify player for the song attached to this letter"
      />
    </View>
  );
}

export const SongPlayer = memo(SongPlayerBase);
