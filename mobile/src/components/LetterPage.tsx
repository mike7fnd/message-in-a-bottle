import { formatDistanceToNowStrict } from 'date-fns';
import { Lock, Sparkles } from 'lucide-react-native';
import React, { memo, useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LETTER_TYPE } from '../lib/card-style';
import type { Message } from '../lib/data';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius, spacing } from '../theme/tokens';
import { AppText } from './ui';

/**
 * One letter, filling one screen of the reader's vertical pager.
 *
 * Split out of read.tsx and memoised for one reason: the reader re-renders
 * whenever the page index changes, and an inline renderItem meant every mounted
 * page re-rendered with it — mid-swipe, while the pager was animating. Now only
 * the action rail redraws and the pages hold still.
 *
 * ── Why this page decides for itself whether it scrolls ──
 *
 * A letter has no length limit, so a long one has to be able to scroll. But a
 * ScrollView nested inside a paging FlatList competes with it for the vertical
 * gesture: the child claims the touch, decides it has nowhere to go, and only
 * then does the parent take over. That handoff is the hitch you feel when
 * swiping between short letters — which is nearly all of them.
 *
 * So each page measures itself and turns its own scrolling off when the letter
 * already fits. The gesture then reaches the pager directly, with nothing to
 * negotiate. Long letters keep scrolling exactly as before.
 *
 * The measurement is free: `contentContainerStyle` uses `flexGrow: 1`, so a
 * short letter's content height settles at exactly the viewport height and
 * anything taller overflows it.
 */

export interface LetterPageProps {
  message: Message;
  width: number;
  height: number;
  /** Opens the recipient's bottle from the salutation. */
  onPressRecipient: (recipient: string) => void;
}

/** Slack in the fit test, so a sub-pixel rounding difference is not "overflow". */
const OVERFLOW_SLOP = 2;

function LetterPageBase({
  message,
  width,
  height,
  onPressRecipient,
}: LetterPageProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Refs, not state: these are inputs to the decision, and storing them in
  // state would render twice for every one measurement.
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const [scrollable, setScrollable] = useState(false);

  const evaluateFit = useCallback(() => {
    if (!viewportHeight.current || !contentHeight.current) return;
    const overflows =
      contentHeight.current > viewportHeight.current + OVERFLOW_SLOP;
    setScrollable((current) => (current === overflows ? current : overflows));
  }, []);

  const openDate = message.openTimestamp
    ? new Date(message.openTimestamp.seconds * 1000)
    : null;
  const isSealed = !!openDate && openDate > new Date();
  // Only claim this when the data says so. Letters written before the counter
  // existed have no value and stay silent.
  const isUnopened = message.openCount === 0;

  return (
    <View style={{ width, height, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        // The whole point of the measurement above.
        scrollEnabled={scrollable}
        // A page that cannot scroll must not rubber-band either — a bounce is
        // the child consuming a gesture that belongs to the pager.
        bounces={scrollable}
        overScrollMode={scrollable ? 'auto' : 'never'}
        onLayout={(e) => {
          viewportHeight.current = e.nativeEvent.layout.height;
          evaluateFit();
        }}
        onContentSizeChange={(_, h) => {
          contentHeight.current = h;
          evaluateFit();
        }}
        contentContainerStyle={{
          // Centres short letters, lets long ones grow past the fold. The
          // vertical padding clears the close button and the action rail so
          // text never slides underneath them.
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + spacing[16],
          paddingBottom: insets.bottom + spacing[20],
          paddingHorizontal: spacing[6],
        }}
      >
        {isUnopened && !isSealed && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              alignSelf: 'flex-start',
              backgroundColor: colors.muted,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              borderRadius: radius.full,
              marginBottom: spacing[5],
            }}
          >
            <Sparkles size={13} color={colors.foreground} />
            <AppText variant="small" color={colors.foreground}>
              You&apos;re the first to open this
            </AppText>
          </View>
        )}

        {/* Salutation, above the letter — the way a letter is actually
            written. The name is set in Playfair italic, matching the web
            message page, so the two read as the same document. */}
        <Pressable
          onPress={() => onPressRecipient(message.recipient)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Open ${message.recipient}'s bottle`}
          style={{ marginBottom: spacing[5] }}
        >
          <AppText
            style={{
              fontFamily: fonts.body,
              fontSize: LETTER_TYPE.fontSize,
              color: colors.foreground,
            }}
          >
            For{' '}
            <AppText
              style={{
                fontFamily: fonts.playfairItalic,
                fontStyle: 'italic',
                fontSize: LETTER_TYPE.fontSize + 4,
                color: colors.foreground,
                textTransform: 'capitalize',
              }}
            >
              {message.recipient}
            </AppText>
            ,
          </AppText>
        </Pressable>

        {isSealed && openDate ? (
          <View style={{ alignItems: 'center' }}>
            <Lock size={34} color={colors.mutedForeground} />
            <AppText variant="h3" style={{ marginTop: spacing[4] }}>
              Sealed
            </AppText>
            <AppText variant="muted" style={{ marginTop: spacing[2] }}>
              Opens in {formatDistanceToNowStrict(openDate)}
            </AppText>
          </View>
        ) : (
          <AppText
            style={{
              fontFamily: LETTER_TYPE.fontFamily,
              // Same size as the cards. Stepping it up here made long letters
              // run past the fold for no real gain — a letter is meant to be
              // read, not projected.
              fontSize: LETTER_TYPE.fontSize,
              lineHeight: LETTER_TYPE.lineHeight,
              fontStyle: LETTER_TYPE.italic ? 'italic' : 'normal',
              color: colors.foreground,
            }}
          >
            {message.content}
          </AppText>
        )}

        {message.timestamp && (
          <AppText variant="small" style={{ marginTop: spacing[6] }}>
            {formatDistanceToNowStrict(message.timestamp)} ago
          </AppText>
        )}
      </ScrollView>
    </View>
  );
}

export const LetterPage = memo(LetterPageBase);
