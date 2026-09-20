import { Music, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '../hooks/useDebounce';
import {
  getCachedFeaturedTracks,
  getCachedSpotifySearch,
  type SpotifyTrack,
} from '../lib/cached-data';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText, Input, Separator, Skeleton } from './ui';

/**
 * "Add a song" — the mobile counterpart of the web send form's picker.
 *
 * It talks to the same two API routes the website uses, through the cached
 * helpers, so the featured set and any given search are fetched once and then
 * served from storage. No Spotify credentials live in the app: the token stays
 * on the server, which is the only place it can be kept secret.
 *
 * Presentation copies SaveToCollectionSheet exactly — hand-animated so the dim
 * fades while the sheet slides, rather than arriving as one solid panel.
 */
export interface SongPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (track: SpotifyTrack) => void;
}

export function SongPickerSheet({
  visible,
  onClose,
  onPick,
}: SongPickerSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, anim]);

  /**
   * Featured set when the box is empty, search results once something is
   * typed. Only runs while the sheet is open, so opening the send screen costs
   * nothing.
   *
   * `cancelled` guards against a slow search for "lo" landing after a fast one
   * for "love" and overwriting it — which reads as the picker ignoring you.
   */
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const term = debouncedQuery.trim();

    setIsLoading(true);
    setError(null);

    (term ? getCachedSpotifySearch(term) : getCachedFeaturedTracks())
      .then((result) => {
        if (cancelled) return;
        setTracks(result);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Song lookup failed:', e);
        setTracks([]);
        // Said plainly rather than shown as an empty list — "no songs found"
        // for a connection problem sends you looking for the wrong thing.
        setError("Couldn't reach Spotify. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, debouncedQuery]);

  const close = useCallback(() => {
    setQuery('');
    setError(null);
    onClose();
  }, [onClose]);

  const choose = useCallback(
    (track: SpotifyTrack) => {
      onPick(track);
      setQuery('');
      onClose();
    },
    [onPick, onClose]
  );

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={close}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}
        >
          <Pressable
            onPress={close}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View
          style={{
            marginTop: 'auto',
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: spacing[5],
            paddingBottom: insets.bottom + spacing[3],
            paddingHorizontal: spacing[5],
            maxHeight: '78%',
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              },
            ],
          }}
        >
          <AppText variant="h3">Add a song</AppText>
          <AppText variant="muted" style={{ marginTop: spacing[1] }}>
            It rides along with your letter for whoever opens it.
          </AppText>

          <View style={{ justifyContent: 'center', marginTop: spacing[4] }}>
            <Search
              size={18}
              color={colors.mutedForeground}
              style={{ position: 'absolute', left: spacing[4], zIndex: 1 }}
            />
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a song or artist..."
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={{ paddingLeft: spacing[10] }}
              accessibilityLabel="Search Spotify for a song"
            />
          </View>

          <ScrollView
            style={{ marginTop: spacing[3] }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[4],
                    paddingVertical: spacing[3],
                  }}
                >
                  <Skeleton style={{ width: 44, height: 44, borderRadius: 4 }} />
                  <View style={{ flex: 1, gap: spacing[2] }}>
                    <Skeleton style={{ width: '70%', height: 14 }} />
                    <Skeleton style={{ width: '40%', height: 12 }} />
                  </View>
                </View>
              ))
            ) : error ? (
              <AppText
                variant="small"
                color={colors.destructive}
                style={{ textAlign: 'center', paddingVertical: spacing[6] }}
              >
                {error}
              </AppText>
            ) : tracks.length === 0 ? (
              <AppText
                variant="muted"
                style={{ textAlign: 'center', paddingVertical: spacing[6] }}
              >
                {debouncedQuery.trim()
                  ? `No songs found for "${debouncedQuery.trim()}".`
                  : 'No songs to show right now.'}
              </AppText>
            ) : (
              <>
                {!debouncedQuery.trim() && (
                  <AppText
                    variant="small"
                    style={{ marginBottom: spacing[2] }}
                  >
                    Featured songs
                  </AppText>
                )}

                {tracks.map((track, i) => (
                  <View key={track.id}>
                    {i > 0 && <Separator />}
                    <Pressable
                      onPress={() => choose(track)}
                      accessibilityRole="button"
                      accessibilityLabel={`${track.name} by ${track.artist}`}
                      style={({ pressed }) => [
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing[4],
                          paddingVertical: spacing[3],
                        },
                        pressed ? { opacity: 0.6 } : null,
                      ]}
                    >
                      {track.albumArt ? (
                        <Image
                          source={{ uri: track.albumArt }}
                          style={{ width: 44, height: 44, borderRadius: 4 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 4,
                            backgroundColor: colors.muted,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Music size={18} color={colors.mutedForeground} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <AppText variant="body" numberOfLines={1}>
                          {track.name}
                        </AppText>
                        <AppText variant="muted" numberOfLines={1}>
                          {track.artist}
                        </AppText>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

