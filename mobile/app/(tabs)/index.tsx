import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Redirect, useRouter } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { BottleTile } from '../../src/components/BottleTile';
import { AppText, Button, Input, Skeleton } from '../../src/components/ui';
import { useContent } from '../../src/context/ContentContext';
import { useFollows } from '../../src/context/FollowsContext';
import { useNotifications } from '../../src/context/NotificationsContext';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { useSearch } from '../../src/context/SearchContext';
import { useDebounce } from '../../src/hooks/useDebounce';
import { getCachedRecipients } from '../../src/lib/cached-data';
import type { Recipient } from '../../src/lib/data';
import { describeLoadError } from '../../src/lib/errors';
import { AD_UNITS } from '../../src/lib/site-config';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, spacing } from '../../src/theme/tokens';

/**
 * Home — the ocean of bottles.
 *
 * This is the app's primary surface and its signature screen: one bottle per
 * name, opened to read what is inside.
 *
 * Personalisation shows up as ordering rather than a separate tab — bottles you
 * follow float to the top. The follow signal is local, so nothing about what
 * you care about is stored server-side.
 */

// ── Auto-hiding chrome ───────────────────────────────────────────────────────
//
// Fixed heights, because the list's top padding has to match the overlay
// exactly and measuring it on the JS thread would mean a frame of mismatch on
// first render.
const HEADER_ROW_H = 46; // icon + bell row, including its bottom padding
const SEARCH_ROW_H = 60; // input (48) + bottom padding
const CHROME_H = HEADER_ROW_H + SEARCH_ROW_H;

/**
 * How far you must scroll in one direction before the chrome reacts.
 *
 * Without this, the natural jitter of a finger resting on a moving list
 * flips the header back and forth every frame. 12px is enough to absorb that
 * while still feeling immediate to a deliberate flick.
 */
const DIRECTION_THRESHOLD = 12;

/** Below this offset the chrome is always shown — you are effectively at the top. */
const ALWAYS_SHOW_ABOVE = CHROME_H;

export default function HomeScreen() {
  const router = useRouter();
  const { content } = useContent();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { hasOnboarded, isReady: onboardingReady } = useOnboarding();
  const { follows, noteViewed, isReady: followsReady } = useFollows();
  const { query, setQuery, remember } = useSearch();
  const { unseenCount } = useNotifications();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(query, 300);

  // ── Scroll-driven chrome ───────────────────────────────────────────────────
  // All of this lives on the UI thread. A JS `onScroll` would have to round-trip
  // over the bridge on every frame, which is exactly what drops frames on a
  // list that is already rendering images.
  const shown = useSharedValue(1); // 1 = visible, 0 = hidden
  const anchorY = useSharedValue(0); // last offset at which direction flipped

  // Mirrored into React state *only* when it flips, so assistive tech can skip
  // the chrome while it is off-screen. A handful of calls per scroll session,
  // not one per frame.
  const [chromeVisible, setChromeVisible] = useState(true);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const delta = y - anchorY.value;

      const reveal = () => {
        if (shown.value !== 1) {
          shown.value = withTiming(1, {
            duration: 180,
            easing: Easing.out(Easing.quad),
          });
          runOnJS(setChromeVisible)(true);
        }
      };

      const conceal = () => {
        if (shown.value !== 0) {
          shown.value = withTiming(0, {
            duration: 220,
            easing: Easing.out(Easing.quad),
          });
          runOnJS(setChromeVisible)(false);
        }
      };

      if (y <= ALWAYS_SHOW_ABOVE) {
        // Near the top the chrome always belongs on screen, whatever the
        // direction — otherwise a bounce at the top can leave it hidden.
        anchorY.value = y;
        reveal();
        return;
      }

      if (delta > DIRECTION_THRESHOLD) {
        anchorY.value = y;
        conceal();
      } else if (delta < -DIRECTION_THRESHOLD) {
        anchorY.value = y;
        reveal();
      }
      // Within the threshold the anchor is deliberately left alone, so small
      // movements accumulate rather than resetting the measurement.
    },
  });

  const chromeStyle = useAnimatedStyle(() => ({
    // Moves by CHROME_H only, not the safe-area inset: the inset portion of
    // this view stays over the status bar, so the area behind the clock keeps
    // its background instead of showing list content through it.
    transform: [{ translateY: -(1 - shown.value) * CHROME_H }],
    opacity: shown.value,
  }));

  // One bottle per row on a phone, two on a tablet — matching the web's
  // `grid-cols-1 sm:grid-cols-2`.
  const numColumns = width >= 700 ? 2 : 1;
  const bottleSize = numColumns === 1 ? 160 : 120;

  const bottleUri = isDark
    ? content.browseBottleImageDark
    : content.browseBottleImageLight;

  // The glow is a separate piece of artwork per theme, not a shadow or a
  // filter — the dark-mode bottle glows a different colour, so tinting the
  // light one would not have matched the web.
  const bottleGlowUri = isDark
    ? content.browseBottleHoverImageDark
    : content.browseBottleHoverImageLight;

  const load = useCallback(
    async (term: string, force = false) => {
      setError(null);
      try {
        const data = await getCachedRecipients(
          term || undefined,
          (fresh) => setRecipients(fresh),
          force
        );
        setRecipients(data);
        // Only remember a search that actually ran and returned.
        if (term.trim()) remember(term);
      } catch (e) {
        console.error('Failed to load bottles:', e);
        setError(describeLoadError(e).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [remember]
  );

  useEffect(() => {
    setIsLoading(true);
    load(debouncedSearch);
  }, [debouncedSearch, load]);

  /**
   * Followed bottles first, everything else in the order the query returned.
   * Skipped while searching: when someone types a name they want that name,
   * not their follows hoisted above it.
   */
  const ordered = useMemo(() => {
    if (debouncedSearch.trim() || follows.length === 0) return recipients;
    const followed: Recipient[] = [];
    const rest: Recipient[] = [];
    for (const r of recipients) {
      (follows.includes(r.name) ? followed : rest).push(r);
    }
    return [...followed, ...rest];
  }, [recipients, follows, debouncedSearch]);

  const openBottle = useCallback(
    (name: string) => {
      noteViewed(name);
      router.push(`/bottle/${encodeURIComponent(name)}`);
    },
    [noteViewed, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recipient }) => (
      <BottleTile
        name={item.name}
        messageCount={item.messageCount}
        countLabel={content.browseNewMessages}
        imageUri={bottleUri}
        glowUri={bottleGlowUri}
        size={bottleSize}
        followed={follows.includes(item.name)}
        fullWidth={numColumns === 1}
        onPress={() => openBottle(item.name)}
      />
    ),
    [
      bottleUri,
      bottleGlowUri,
      bottleSize,
      content.browseNewMessages,
      follows,
      numColumns,
      openBottle,
    ]
  );

  // First launch: explain the place once, then never again.
  if (onboardingReady && !hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isLoading || !followsReady ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingTop: insets.top + CHROME_H,
            padding: spacing[5],
          }}
        >
          {Array.from({ length: numColumns === 1 ? 3 : 4 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: `${100 / numColumns}%`,
                alignItems: 'center',
                paddingVertical: spacing[5],
              }}
            >
              <Skeleton
                style={{
                  width: bottleSize,
                  height: bottleSize,
                  borderRadius: bottleSize / 2,
                }}
              />
              <Skeleton
                style={{ width: 90, height: 22, marginTop: spacing[3] }}
              />
            </View>
          ))}
        </View>
      ) : (
        <Animated.FlatList
          data={ordered}
          keyExtractor={(item) => (item as Recipient).name}
          renderItem={renderItem as never}
          numColumns={numColumns}
          // FlatList cannot change numColumns in place; remount on rotation.
          key={numColumns}
          onScroll={scrollHandler}
          // 16ms ≈ one frame. The handler itself runs on the UI thread, so this
          // only governs how often it is invoked, not how expensive it is.
          scrollEventThrottle={16}
          contentContainerStyle={{
            // Matches the overlay exactly, so nothing starts life underneath it.
            paddingTop: insets.top + CHROME_H,
            paddingHorizontal: spacing[3],
            paddingBottom: tabBarHeight + spacing[8],
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                load(debouncedSearch, true);
              }}
              // Pulls down to below the chrome rather than behind it.
              progressViewOffset={insets.top + CHROME_H}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <View style={{ padding: spacing[10], alignItems: 'center' }}>
              <AppText
                variant="muted"
                style={{ textAlign: 'center', marginBottom: spacing[5] }}
              >
                {error
                  ? error
                  : query.trim()
                    ? `${content.browseNoResults} "${query.trim()}".`
                    : 'No bottles in the ocean yet. Be the first to send one.'}
              </AppText>
              {!error && (
                <Button
                  title="Send a message"
                  onPress={() => router.push('/send')}
                />
              )}
            </View>
          }
          ListFooterComponent={
            ordered.length > 0 ? (
              <>
                <AppText
                  variant="small"
                  style={{ textAlign: 'center', marginTop: spacing[4] }}
                >
                  {content.browseEnd}
                </AppText>
                {/* After the whole grid, never between bottles — a tap here
                    must never be mistaken for opening one. */}
                <AdBanner unitId={AD_UNITS.browseFeed} />
              </>
            ) : null
          }
        />
      )}

      {/* Chrome, overlaid rather than in flow.
          Absolute positioning is what lets it hide without reflowing the list:
          the content is already scrolled underneath, so sliding this away
          simply reveals more of it — no layout pass, no jump. */}
      <Animated.View
        accessibilityElementsHidden={!chromeVisible}
        importantForAccessibility={
          chromeVisible ? 'auto' : 'no-hide-descendants'
        }
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            paddingTop: insets.top,
            backgroundColor: colors.background,
          },
          chromeStyle,
        ]}
      >
        {/* Icon centred, notifications right. The spacer on the left is the
            same width as the bell so the mark sits optically centred. */}
        <View
          style={{
            height: HEADER_ROW_H,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[2],
          }}
        >
          <View style={{ width: 38 }} />

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 34, height: 34, borderRadius: radius.md }}
              resizeMode="contain"
              accessibilityLabel="Message in a Bottle"
            />
          </View>

          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              unseenCount > 0
                ? `Notifications, ${unseenCount} new`
                : 'Notifications'
            }
            style={({ pressed }) => [
              {
                width: 38,
                height: 38,
                alignItems: 'center',
                justifyContent: 'center',
              },
              pressed ? { opacity: 0.5 } : null,
            ]}
          >
            <Bell size={23} color={colors.foreground} />
            {unseenCount > 0 && (
              // A dot, not a count: the exact number of letters waiting is not
              // something anyone acts on differently. Ringed in the page colour
              // so it stays legible against the bell's own strokes.
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 7,
                  width: 9,
                  height: 9,
                  borderRadius: radius.full,
                  backgroundColor: colors.primary,
                  borderWidth: 1.5,
                  borderColor: colors.background,
                }}
              />
            )}
          </Pressable>
        </View>

        <View
          style={{
            height: SEARCH_ROW_H,
            paddingHorizontal: spacing[5],
            justifyContent: 'flex-start',
          }}
        >
          <View style={{ justifyContent: 'center' }}>
            <Search
              size={18}
              color={colors.mutedForeground}
              style={{ position: 'absolute', left: spacing[4], zIndex: 1 }}
            />
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder={content.browseSearchPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={{ paddingLeft: spacing[10] }}
              accessibilityLabel="Search for a name"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
