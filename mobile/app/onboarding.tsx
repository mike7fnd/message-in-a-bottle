import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../src/components/ui';
import { useOnboarding } from '../src/context/OnboardingContext';
import { useContent } from '../src/context/ContentContext';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing } from '../src/theme/tokens';

/**
 * First launch only.
 *
 * This carries what the old marketing home page used to say. Two of these three
 * cards exist because the product genuinely surprises people: messages are
 * public, and naming someone does not notify them. Getting that wrong is the
 * difference between a sweet note and an accidental overshare, so it is said
 * plainly before anyone writes anything.
 */
interface Slide {
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Write what you can’t say',
    body: 'Address a note to a first name — someone you miss, someone you never told, or nobody in particular. You don’t need an account.',
  },
  {
    title: 'Everything here is public',
    body: 'Your message drifts into an ocean anyone can read. Naming someone doesn’t notify them and doesn’t keep anyone else out — it just files the note under that name.',
  },
  {
    title: 'Read what washes up',
    body: 'Follow the bottles you care about and they’ll show up in your feed. Nothing you follow or save ever leaves your phone.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { complete } = useOnboarding();
  const { content } = useContent();

  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const finish = useCallback(() => {
    complete();
    router.replace('/');
  }, [complete, router]);

  const next = useCallback(() => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    const target = index + 1;
    setIndex(target);
    listRef.current?.scrollToOffset({ offset: target * width, animated: true });
  }, [index, width, finish]);

  // Keep the dots in step when the slide is swiped rather than tapped.
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / width);
      if (page !== index) setIndex(page);
    },
    [index, width]
  );

  const isLast = index === SLIDES.length - 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + spacing[6],
      }}
    >
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: spacing[8],
            }}
          >
            <AppText variant="h1" style={{ fontSize: 34, lineHeight: 42 }}>
              {item.title}
            </AppText>
            <AppText
              variant="muted"
              style={{ marginTop: spacing[4], fontSize: 17, lineHeight: 26 }}
            >
              {item.body}
            </AppText>
          </View>
        )}
      />

      <View style={{ paddingHorizontal: spacing[8] }}>
        {/* Progress dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing[2],
            marginBottom: spacing[6],
          }}
        >
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={{
                width: i === index ? 20 : 7,
                height: 7,
                borderRadius: radius.full,
                backgroundColor:
                  i === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        <Button
          title={isLast ? (content.homeSendButton ?? 'Get started') : 'Next'}
          size="lg"
          onPress={next}
          fullWidth
        />
        {!isLast && (
          <Button
            title="Skip"
            variant="ghost"
            onPress={finish}
            fullWidth
            style={{ marginTop: spacing[2] }}
          />
        )}
      </View>
    </View>
  );
}
