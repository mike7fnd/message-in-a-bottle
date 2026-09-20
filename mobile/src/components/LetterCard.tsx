import { format, formatDistanceToNowStrict } from 'date-fns';
import { Lock, Sparkles } from 'lucide-react-native';
import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { LETTER_TYPE } from '../lib/card-style';
import type { Message } from '../lib/data';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText } from './ui';

/**
 * A letter, shown in full.
 *
 * The one card used everywhere messages are listed — inside a bottle, in a
 * collection, in favorites — so the app has a single reading surface rather
 * than three that drift apart.
 *
 * Deliberately not truncated. These are short notes, and cutting one off at
 * four lines means the list becomes a set of teasers you have to tap through.
 * Showing the whole thing makes the bottle itself the place you read.
 *
 * Carries no actions. Favouriting, saving and sharing all live in the reader
 * you get by tapping a card — a list of letters should read as a page of
 * writing, not a row of buttons per item, and it keeps the tap target for
 * 'open this' unambiguous.
 */
export interface LetterCardProps {
  message: Message;
  /** Opens the full-screen reader, where the actions live. */
  onPress: () => void;
  /** Shown under the letter when the recipient is not already obvious. */
  showRecipient?: boolean;
  onPressRecipient?: () => void;
}

function LetterCardBase({
  message,
  onPress,
  showRecipient = false,
  onPressRecipient,
}: LetterCardProps) {
  const { colors } = useTheme();

  const openDate = message.openTimestamp
    ? new Date(message.openTimestamp.seconds * 1000)
    : null;
  const isSealed = !!openDate && openDate > new Date();
  // Only claimed when the counter says so — letters predating it have no value,
  // and asserting "nobody has read this" without evidence would be untrue.
  const isUnopened = message.openCount === 0;

  const stamp = message.timestamp
    ? format(message.timestamp, "MMMM d, yyyy 'at' h:mm a")
    : 'Just now';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        isSealed
          ? `Sealed letter for ${message.recipient}`
          : `Letter for ${message.recipient}: ${message.content}`
      }
      style={({ pressed }) => [
        {
          backgroundColor: colors.card,
          borderRadius: radius.sheet,
          padding: spacing[5],
          marginBottom: spacing[4],
        },
        pressed ? { opacity: 0.94 } : null,
      ]}
    >
      <View>
        {isUnopened && !isSealed && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[1],
              alignSelf: 'flex-start',
              backgroundColor: colors.muted,
              paddingHorizontal: spacing[2],
              paddingVertical: 3,
              borderRadius: radius.full,
              marginBottom: spacing[3],
            }}
          >
            <Sparkles size={11} color={colors.foreground} />
            <AppText
              variant="small"
              color={colors.foreground}
              style={{ fontSize: 11 }}
            >
              Unopened
            </AppText>
          </View>
        )}

        {isSealed && openDate ? (
          // The text is never rendered for a sealed letter — not even blurred.
          // Blur is only a visual effect; the words would still be in the tree
          // for a screen reader to read out.
          <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
            <Lock size={22} color={colors.mutedForeground} />
            <AppText variant="body" style={{ marginTop: spacing[3] }}>
              Sealed
            </AppText>
            <AppText variant="muted" style={{ marginTop: spacing[1] }}>
              Opens in {formatDistanceToNowStrict(openDate)}
            </AppText>
          </View>
        ) : (
          <AppText
            style={{
              fontFamily: LETTER_TYPE.fontFamily,
              fontSize: LETTER_TYPE.fontSize,
              lineHeight: LETTER_TYPE.lineHeight,
              fontStyle: LETTER_TYPE.italic ? 'italic' : 'normal',
              color: colors.foreground,
            }}
          >
            {message.content}
          </AppText>
        )}

        {showRecipient && (
          <Pressable
            onPress={onPressRecipient}
            hitSlop={6}
            disabled={!onPressRecipient}
            accessibilityRole={onPressRecipient ? 'button' : undefined}
            accessibilityLabel={`Open ${message.recipient}'s bottle`}
          >
            <AppText
              variant="muted"
              numberOfLines={1}
              style={{
                marginTop: spacing[4],
                textTransform: 'capitalize',
                color: colors.foreground,
              }}
            >
              for {message.recipient}
            </AppText>
          </Pressable>
        )}

        <AppText variant="small" style={{ marginTop: spacing[3] }}>
          {stamp}
        </AppText>
      </View>
    </Pressable>
  );
}

export const LetterCard = memo(LetterCardBase);
