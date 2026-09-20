import { useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LetterCard } from '../src/components/LetterCard';
import { AppText, Button, Input } from '../src/components/ui';
import { useFavorites } from '../src/context/FavoritesContext';
import { useReader } from '../src/context/ReaderContext';
import type { Message } from '../src/lib/data';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing } from '../src/theme/tokens';

/**
 * Messages the reader has hearted.
 *
 * Filtering happens in memory because the whole list is already on the device —
 * favorites are stored locally and never sent to Firestore, so there is no
 * query to make and no reason to debounce.
 */
export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();
  const { openReader } = useReader();

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return favorites;
    return favorites.filter(
      (m) =>
        m.recipient.toLowerCase().includes(term) ||
        m.content.toLowerCase().includes(term)
    );
  }, [favorites, search]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.backgroundGrouped,
        paddingTop: insets.top,
      }}
    >
      <View style={{ paddingHorizontal: spacing[5], paddingTop: spacing[2] }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
        >
          <ChevronLeft size={18} color={colors.mutedForeground} />
          <AppText variant="muted">Back</AppText>
        </Pressable>

        <AppText variant="h1" style={{ marginTop: spacing[4] }}>
          Favorites
        </AppText>
        <AppText variant="muted" style={{ marginTop: spacing[1] }}>
          Saved on this device only — we never see them.
        </AppText>

        {favorites.length > 0 && (
          <View style={{ marginTop: spacing[4], justifyContent: 'center' }}>
            <Search
              size={18}
              color={colors.mutedForeground}
              style={{ position: 'absolute', left: spacing[4], zIndex: 1 }}
            />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search your favorites..."
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              style={{ paddingLeft: spacing[10] }}
              accessibilityLabel="Search favorites"
            />
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: spacing[16],
        }}
        renderItem={({ item, index }) => (
          <LetterCard
            message={item}
            onPress={() => router.push(`/message/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing[12], alignItems: 'center' }}>
            <AppText variant="muted" style={{ textAlign: 'center' }}>
              {search
                ? `Nothing matching "${search}".`
                : 'No favorites yet. Open any letter and tap the heart to keep it here.'}
            </AppText>
            {!search && (
              <Button
                title="Browse bottles"
                onPress={() => router.push('/browse')}
                style={{ marginTop: spacing[5] }}
              />
            )}
          </View>
        }
      />
    </View>
  );
}
