import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LetterCard } from '../../src/components/LetterCard';
import { AppText, Card, Skeleton } from '../../src/components/ui';
import { useContent } from '../../src/context/ContentContext';
import { useFollows } from '../../src/context/FollowsContext';
import { useReader } from '../../src/context/ReaderContext';
import { getCachedMessagesForRecipient } from '../../src/lib/cached-data';
import type { Message } from '../../src/lib/data';
import { describeLoadError } from '../../src/lib/errors';
import { useTheme } from '../../src/theme/ThemeProvider';
import { fonts, fontSize, radius, spacing } from '../../src/theme/tokens';

/**
 * One bottle — every message addressed to a single name.
 *
 * Mirrors the web's /bottle/[name]. The header renders immediately rather than
 * being replaced by a full-screen skeleton while loading, which is the same fix
 * applied to the web version: the reader should always know whose bottle they
 * opened, even on a slow connection.
 */
export default function BottleScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { content } = useContent();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isFollowing, toggleFollow, noteViewed } = useFollows();
  const { openReader } = useReader();

  const recipientName = decodeURIComponent(name ?? '');
  const following = isFollowing(recipientName);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!recipientName) return;
      setError(null);
      try {
        const data = await getCachedMessagesForRecipient(
          recipientName,
          (fresh) => setMessages(fresh),
          force
        );
        setMessages(data);
      } catch (e) {
        console.error('Failed to load bottle:', e);
        setError(describeLoadError(e).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [recipientName]
  );

  useEffect(() => {
    load();
    // Opening a bottle is a personalisation signal for the For you feed.
    if (recipientName) noteViewed(recipientName);
  }, [load, recipientName, noteViewed]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.backgroundGrouped,
        paddingTop: insets.top,
      }}
    >
      {/* Compact header: back · title · follow.
          The letters themselves are the content here, so the chrome stays to
          one row — the old version spent four stacked blocks on a heading, a
          subtitle and a button before a reader saw anything.

          The two circles are the same size on both sides so the title sits
          optically centred; a bare icon on one side would pull it off-axis. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing[4],
          paddingTop: spacing[2],
          paddingBottom: spacing[3],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={content.bottleBackButton}
          style={({ pressed }) => [
            {
              width: 38,
              height: 38,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.muted,
            },
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <ArrowLeft size={19} color={colors.foreground} />
        </Pressable>

        <AppText
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            paddingHorizontal: spacing[2],
            fontFamily: fonts.bodyBold,
            fontSize: fontSize.sm,
            color: colors.foreground,
          }}
        >
          Letters for{' '}
          <AppText
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: fontSize.sm,
              color: colors.foreground,
              textTransform: 'capitalize',
            }}
          >
            {recipientName}
          </AppText>
        </AppText>

        {/* Following a *name*, not a person — nobody here has an account to
            follow. Kept on the device only. */}
        <Pressable
          onPress={() => toggleFollow(recipientName)}
          hitSlop={10}
          accessibilityRole="switch"
          accessibilityState={{ checked: following }}
          accessibilityLabel={
            following ? `Unfollow ${recipientName}` : `Follow ${recipientName}`
          }
          style={({ pressed }) => [
            {
              width: 38,
              height: 38,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: following ? colors.primary : colors.muted,
            },
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          {following ? (
            <Bell
              size={18}
              color={colors.primaryForeground}
              fill={colors.primaryForeground}
            />
          ) : (
            <BellOff size={18} color={colors.foreground} />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing[5], gap: spacing[6] }}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton style={{ height: 14, width: '100%' }} />
              <Skeleton style={{ height: 14, width: '92%', marginTop: spacing[2] }} />
              <Skeleton style={{ height: 14, width: '70%', marginTop: spacing[2] }} />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: spacing[16],
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                load(true);
              }}
              tintColor={colors.mutedForeground}
            />
          }
          renderItem={({ item, index }) => (
            <LetterCard
              message={item}
              // Hands the reader the whole bottle, so swiping carries you
              // through every letter written to this name.
              onPress={() => {
                openReader(messages, index);
                router.push('/read');
              }}
            />
          )}
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing[16], alignItems: 'center' }}>
              <AppText variant="muted" style={{ textAlign: 'center' }}>
                {error ?? content.bottleNoMessages}
              </AppText>
            </View>
          }
        />
      )}
    </View>
  );
}
