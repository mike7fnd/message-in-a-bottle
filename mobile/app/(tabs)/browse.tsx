import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Bell, Clock, Search, X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, Separator } from '../../src/components/ui';
import { useFollows } from '../../src/context/FollowsContext';
import { useSearch } from '../../src/context/SearchContext';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, spacing } from '../../src/theme/tokens';

/**
 * Your activity — searches you have run, bottles you follow, bottles you have
 * opened.
 *
 * The bottle grid moved to Home, so this tab became the place you retrace your
 * own steps. Everything on it is local: search terms, follows and view history
 * never leave the phone, which is the only honest way to offer this in an app
 * built on anonymity.
 *
 * Tapping a past search sets the shared query and returns to Home rather than
 * showing results here — one place to see bottles, not two.
 */
function Row({
  icon,
  label,
  sublabel,
  onPress,
  onDismiss,
  dismissLabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          paddingVertical: spacing[4],
        },
        pressed ? { opacity: 0.6 } : null,
      ]}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <AppText
          variant="body"
          numberOfLines={1}
          style={{ textTransform: 'capitalize' }}
        >
          {label}
        </AppText>
        {sublabel ? <AppText variant="small">{sublabel}</AppText> : null}
      </View>
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel ?? `Remove ${label}`}
        >
          <X size={17} color={colors.mutedForeground} />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { history, forget, clearHistory, setQuery } = useSearch();
  const { follows, recentlyViewed, toggleFollow, noteViewed } = useFollows();

  const runSearch = useCallback(
    (term: string) => {
      setQuery(term);
      // navigate, not push: Home is a sibling tab, and pushing would stack a
      // second copy of it on top of this one.
      router.navigate('/');
    },
    [router, setQuery]
  );

  const openBottle = useCallback(
    (name: string) => {
      noteViewed(name);
      router.push(`/bottle/${encodeURIComponent(name)}`);
    },
    [noteViewed, router]
  );

  const confirmClear = useCallback(
    () =>
      Alert.alert('Clear search history?', 'This only affects this phone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ]),
    [clearHistory]
  );

  const isEmpty =
    history.length === 0 && follows.length === 0 && recentlyViewed.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingTop: insets.top + spacing[2],
        paddingBottom: tabBarHeight + spacing[8],
      }}
    >
      <AppText variant="h1">Your activity</AppText>
      <AppText variant="muted" style={{ marginTop: spacing[1] }}>
        Searches, follows and bottles you&apos;ve opened. All kept on this phone.
      </AppText>

      {isEmpty ? (
        <View style={{ paddingVertical: spacing[16], alignItems: 'center' }}>
          <AppText
            variant="muted"
            style={{ textAlign: 'center', marginBottom: spacing[5] }}
          >
            Nothing here yet. Search for a name on Home and it&apos;ll show up.
          </AppText>
          <Button title="Find bottles" onPress={() => router.navigate('/')} />
        </View>
      ) : null}

      {/* Following */}
      {follows.length > 0 && (
        <>
          <AppText variant="h3" style={{ marginTop: spacing[7] }}>
            Following
          </AppText>
          <Card style={{ marginTop: spacing[3], paddingVertical: spacing[2] }}>
            {follows.map((name, i) => (
              <View key={name}>
                {i > 0 && <Separator />}
                <Row
                  icon={<Bell size={18} color={colors.mutedForeground} />}
                  label={name}
                  onPress={() => openBottle(name)}
                  onDismiss={() => toggleFollow(name)}
                  dismissLabel={`Unfollow ${name}`}
                />
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Recent searches */}
      {history.length > 0 && (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing[7],
            }}
          >
            <AppText variant="h3" style={{ flex: 1 }}>
              Recent searches
            </AppText>
            <Pressable
              onPress={confirmClear}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search history"
            >
              <AppText variant="small" color={colors.primary}>
                Clear
              </AppText>
            </Pressable>
          </View>

          {/* Chips read faster than rows for short, repeated terms. */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing[2],
              marginTop: spacing[3],
            }}
          >
            {history.map((term) => (
              <Pressable
                key={term}
                onPress={() => runSearch(term)}
                onLongPress={() => forget(term)}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${term}`}
                accessibilityHint="Long press to remove from history"
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing[2],
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: radius.pill,
                    backgroundColor: colors.muted,
                  },
                  pressed ? { opacity: 0.6 } : null,
                ]}
              >
                <Search size={13} color={colors.mutedForeground} />
                <AppText variant="small" color={colors.foreground}>
                  {term}
                </AppText>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* Recently opened */}
      {recentlyViewed.length > 0 && (
        <>
          <AppText variant="h3" style={{ marginTop: spacing[7] }}>
            Recently opened
          </AppText>
          <Card style={{ marginTop: spacing[3], paddingVertical: spacing[2] }}>
            {recentlyViewed.slice(0, 12).map((name, i) => (
              <View key={name}>
                {i > 0 && <Separator />}
                <Row
                  icon={<Clock size={18} color={colors.mutedForeground} />}
                  label={name}
                  onPress={() => openBottle(name)}
                />
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
