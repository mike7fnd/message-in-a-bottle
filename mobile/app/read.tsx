import { useRouter } from 'expo-router';
import { Bookmark, Heart, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Share,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LetterPage } from '../src/components/LetterPage';
import { SaveToCollectionSheet } from '../src/components/SaveToCollectionSheet';
import { ShareCard, SHARE_CARD } from '../src/components/ShareCard';
import { AppText, Button } from '../src/components/ui';
import { useCollections } from '../src/context/CollectionsContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useFollows } from '../src/context/FollowsContext';
import { useReader } from '../src/context/ReaderContext';
import { markOpened, type Message } from '../src/lib/data';
import { siteConfig } from '../src/lib/site-config';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing } from '../src/theme/tokens';

/**
 * Full-screen letter reader.
 *
 * One letter per screen, swiped vertically — the consumption model TikTok
 * proved, applied to something that actually rewards undivided attention. The
 * feed is for browsing; this is for reading.
 *
 * It costs no reads: the queue was already fetched by whichever list opened it.
 */
/**
 * Accents for the two "kept" states.
 *
 * Neither colour is in the palette — the rail is the only place in the app
 * where state is carried by hue alone, so these live here rather than becoming
 * tokens nothing else would use.
 *
 * Yellow needs two shades. #EAB308 on white is 1.9:1, which is a smear rather
 * than an icon; #CA8A04 measures 3.6:1 there, and since the shape itself also
 * changes from outline to solid, the colour is reinforcement rather than the
 * sole signal.
 */
const FAVORITE_COLOR = '#EF4444';
const SAVED_COLOR_LIGHT = '#CA8A04';
const SAVED_COLOR_DARK = '#EAB308';

export default function ReaderScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { queue, startIndex } = useReader();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { collectionsContaining } = useCollections();
  const { noteViewed } = useFollows();

  const [index, setIndex] = useState(startIndex);
  const [saveTarget, setSaveTarget] = useState<Message | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<View>(null);

  const currentLetter = queue[index];
  const isCurrentFavorite = !!currentLetter && isFavorite(currentLetter.id);
  // Saved into at least one collection. Which ones is the sheet's business;
  // the rail only answers "is this kept anywhere".
  const isCurrentSaved =
    !!currentLetter && collectionsContaining(currentLetter.id).length > 0;
  const savedColor = isDark ? SAVED_COLOR_DARK : SAVED_COLOR_LIGHT;

  // One open per letter per session, so swiping back and forth does not
  // repeatedly write to the counter.
  const counted = useRef<Set<string>>(new Set());

  const registerOpen = useCallback(
    (message: Message | undefined) => {
      if (!message || counted.current.has(message.id)) return;
      counted.current.add(message.id);
      markOpened(message.id);
      noteViewed(message.recipient);
    },
    [noteViewed]
  );

  // The viewability handler below is frozen at mount, so it cannot call
  // registerOpen directly without pinning the first render's closure.
  const registerOpenRef = useRef(registerOpen);
  registerOpenRef.current = registerOpen;

  useEffect(() => {
    registerOpen(queue[startIndex]);
  }, [queue, startIndex, registerOpen]);

  const openRecipient = useCallback(
    (recipient: string) => {
      router.push(`/bottle/${encodeURIComponent(recipient)}`);
    },
    [router]
  );

  /**
   * Shares the designed 1080×1920 card, matching the web app and the send
   * screen — an image is the only thing Instagram or TikTok can actually
   * receive, and a bare link posted to a story is just blue text.
   *
   * Falls back to sharing the link if the capture fails, so the button always
   * does something useful rather than silently doing nothing.
   */
  const shareLetter = useCallback(async () => {
    const letter = queue[index];
    if (!letter) return;

    const url = `${siteConfig.apiBaseUrl}/message/${letter.id}`;
    const shareLink = () =>
      Share.share({
        message: `A message in a bottle for ${letter.recipient}: ${url}`,
        url,
      }).catch(() => {
        // A dismissed sheet throws on iOS — someone changing their mind, not a
        // failure worth reporting.
      });

    const openDate = letter.openTimestamp
      ? new Date(letter.openTimestamp.seconds * 1000)
      : null;
    // Never render a sealed letter into an image. The whole point of a time
    // capsule is that the words are not readable yet, and a shared card would
    // hand them out in plain sight.
    if (openDate && openDate > new Date()) {
      await shareLink();
      return;
    }

    setSharing(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        width: SHARE_CARD.width * SHARE_CARD.pixelRatio,
        height: SHARE_CARD.height * SHARE_CARD.pixelRatio,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `A letter for ${letter.recipient}`,
        });
      } else {
        await shareLink();
      }
    } catch (e) {
      console.error('Card share failed:', e);
      await shareLink();
    } finally {
      setSharing(false);
    }
  }, [queue, index]);

  /**
   * Which letter is on screen.
   *
   * FlatList captures this once on mount and ignores later changes, so both the
   * config and the handler have to be refs — passing a fresh array on each
   * render makes it throw outright.
   *
   * The handler reads the live queue out of a ref for the same reason: it is
   * frozen at mount and would otherwise close over the first render's queue
   * forever.
   */
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const viewabilityPairs = useRef([
    {
      // 60%, not 100%: at exactly one page per screen, a page that owns most of
      // the viewport is the one being read. Waiting for 100% means the index
      // never updates if the pager settles a pixel off.
      viewabilityConfig: { itemVisiblePercentThreshold: 60 },
      onViewableItemsChanged: ({
        viewableItems,
      }: {
        viewableItems: ViewToken[];
      }) => {
        const first = viewableItems[0];
        if (first?.index == null) return;
        setIndex(first.index);
        registerOpenRef.current(queueRef.current[first.index]);
      },
    },
  ]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <LetterPage
        message={item}
        width={width}
        height={height}
        onPressRecipient={openRecipient}
      />
    ),
    [width, height, openRecipient]
  );

  if (queue.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          padding: spacing[6],
        }}
      >
        <AppText variant="h3">Nothing to read</AppText>
        <Button
          title="Back to the feed"
          onPress={() => router.replace('/')}
          style={{ marginTop: spacing[5] }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={queue}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={startIndex}
        // Every page is exactly one screen tall, so the offset is exact and
        // FlatList never has to measure — which is what makes
        // initialScrollIndex safe here, and lets the windowing numbers below
        // be this tight.
        getItemLayout={(_, i) => ({
          length: height,
          offset: height * i,
          index: i,
        })}
        // Settles onto a page quickly instead of gliding to a stop, which is
        // what makes a pager feel decisive rather than loose.
        decelerationRate="fast"
        // One page per flick, however hard the flick. Skidding past three
        // letters to land on a fourth is disorienting when each one is a
        // separate thing to read.
        disableIntervalMomentum
        snapToInterval={height}
        snapToAlignment="start"
        // Pages are full-screen, so there is never a reason to keep more
        // than the neighbours alive. Holding the mounted set this small is
        // most of why the swipe stays at frame rate.
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        updateCellsBatchingPeriod={50}
        // Replaces the old per-frame onScroll. That one ran setIndex on the
        // JS thread on every scroll event, so the whole screen re-rendered
        // mid-swipe; this fires once, when a page actually takes over.
        viewabilityConfigCallbackPairs={viewabilityPairs.current}
      />

      {/* Close. Floats above the pager rather than living in a header, so the
          letter gets the entire screen. */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close reader"
        style={{
          position: 'absolute',
          top: insets.top + spacing[3],
          left: spacing[5],
          width: 38,
          height: 38,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.muted,
        }}
      >
        <X size={19} color={colors.foreground} />
      </Pressable>

      {/* Actions rail, pinned bottom-right like a video app's side column. */}
      <View
        style={{
          position: 'absolute',
          right: spacing[5],
          bottom: insets.bottom + spacing[8],
          alignItems: 'center',
          gap: spacing[4],
        }}
      >
        <Pressable
          onPress={() => queue[index] && toggleFavorite(queue[index])}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Favorite this letter"
        >
          {/* Inactive icons are outlined with an opaque interior rather than
              left transparent, so they stay defined against the letter's text
              when a long one scrolls up behind the rail. */}
          <Heart
            size={27}
            color={isCurrentFavorite ? FAVORITE_COLOR : colors.foreground}
            fill={isCurrentFavorite ? FAVORITE_COLOR : colors.background}
          />
        </Pressable>

        <Pressable
          onPress={() => setSaveTarget(queue[index] ?? null)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={
            isCurrentSaved
              ? 'Saved to a collection. Change where it is saved'
              : 'Save to a collection'
          }
          // Not a switch: tapping opens the sheet rather than toggling, so
          // announcing an on/off state would promise something it does not do.
          accessibilityState={{ selected: isCurrentSaved }}
        >
          <Bookmark
            size={26}
            color={
              isCurrentSaved
                ? savedColor
                : colors.foreground
            }
            fill={isCurrentSaved ? savedColor : colors.background}
          />
        </Pressable>

        <Pressable
          onPress={shareLetter}
          disabled={sharing}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Share this letter"
          accessibilityState={{ busy: sharing }}
        >
          <Share2
            size={26}
            color={sharing ? colors.mutedForeground : colors.foreground}
            fill={colors.background}
          />
        </Pressable>
      </View>

      {/* Off-screen capture target for the shareable card.
          Only the letter currently on screen is rendered — mounting one per
          queued letter would build dozens of off-canvas views for an image
          almost none of them will ever produce.

          Pushed off-canvas rather than hidden: view-shot needs a real, laid-out
          native view, and `display: none` has no geometry to capture. */}
      {currentLetter && (
        <View
          style={{ position: 'absolute', left: -9999, top: 0 }}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ShareCard
            ref={shareCardRef}
            recipient={currentLetter.recipient}
            message={currentLetter.content}
          />
        </View>
      )}

      <SaveToCollectionSheet
        message={saveTarget}
        onClose={() => setSaveTarget(null)}
      />
    </View>
  );
}
