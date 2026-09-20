import { formatDistanceToNowStrict } from 'date-fns';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Lock } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, Skeleton } from '../src/components/ui';
import { useFollows } from '../src/context/FollowsContext';
import { useNotifications } from '../src/context/NotificationsContext';
import { useReader } from '../src/context/ReaderContext';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing } from '../src/theme/tokens';

/**
 * New letters written to the bottles you follow.
 *
 * Opening the screen marks everything seen, which is why the unread dots are
 * captured on mount rather than read live — otherwise they would vanish under
 * the reader's eyes as the list rendered.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { follows, noteViewed } = useFollows();
  const { items, isLoading, error, refresh, markAllSeen, isUnseen } =
    useNotifications();
  const { openReader } = useReader();

  // Snapshot which were unseen before marking them read.
  const [unseenIds] = React.useState<Set<string>>(
    () => new Set(items.filter(isUnseen).map((m) => m.id))
  );

  useEffect(() => {
    markAllSeen();
  }, [markAllSeen]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.backgroundGrouped,
        paddingTop: insets.top,
      }}
    >
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
          accessibilityLabel="Go back"
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
          variant="body"
          style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}
        >
          Notifications
        </AppText>

        {/* Balances the back circle so the title stays optically centred. */}
        <View style={{ width: 38 }} />
      </View>

      {isLoading && items.length === 0 ? (
        <View style={{ padding: spacing[5], gap: spacing[3] }}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton style={{ height: 14, width: '55%' }} />
              <Skeleton
                style={{ height: 14, width: '85%', marginTop: spacing[3] }}
              />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: spacing[5],
            paddingBottom: spacing[16],
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refresh(true)}
              tintColor={colors.mutedForeground}
            />
          }
          renderItem={({ item, index }) => {
            const wasUnseen = unseenIds.has(item.id);
            const openDate = item.openTimestamp
              ? new Date(item.openTimestamp.seconds * 1000)
              : null;
            const isSealed = !!openDate && openDate > new Date();

            return (
              <Pressable
                onPress={() => {
                  noteViewed(item.recipient);
                  openReader(items, index);
                  router.push('/read');
                }}
                accessibilityRole="button"
                accessibilityLabel={`New letter for ${item.recipient}`}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: spacing[3],
                    backgroundColor: colors.card,
                    borderRadius: radius.container,
                    padding: spacing[4],
                    marginBottom: spacing[3],
                  },
                  pressed ? { opacity: 0.7 } : null,
                ]}
              >
                {/* Unread dot */}
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: radius.full,
                    marginTop: 7,
                    backgroundColor: wasUnseen
                      ? colors.primary
                      : 'transparent',
                  }}
                />

                <View style={{ flex: 1 }}>
                  <AppText variant="body" style={{ textTransform: 'capitalize' }}>
                    New letter for {item.recipient}
                  </AppText>

                  {isSealed ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing[1],
                        marginTop: spacing[1],
                      }}
                    >
                      <Lock size={12} color={colors.mutedForeground} />
                      <AppText variant="small">Sealed for now</AppText>
                    </View>
                  ) : (
                    <AppText
                      variant="muted"
                      numberOfLines={2}
                      style={{ marginTop: spacing[1] }}
                    >
                      {item.content}
                    </AppText>
                  )}

                  {item.timestamp && (
                    <AppText variant="small" style={{ marginTop: spacing[2] }}>
                      {formatDistanceToNowStrict(item.timestamp)} ago
                    </AppText>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing[16], alignItems: 'center' }}>
              <Bell size={28} color={colors.mutedForeground} />
              <AppText
                variant="muted"
                style={{
                  textAlign: 'center',
                  marginTop: spacing[4],
                  marginBottom: spacing[5],
                }}
              >
                {error
                  ? error
                  : follows.length === 0
                    ? 'Follow a bottle and you’ll be told when someone writes to that name.'
                    : 'Nothing new since you last looked.'}
              </AppText>
              {follows.length === 0 && !error && (
                <Button title="Find bottles" onPress={() => router.back()} />
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
