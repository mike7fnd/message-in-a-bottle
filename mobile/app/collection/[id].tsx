import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LetterCard } from '../../src/components/LetterCard';
import { AppText, Button } from '../../src/components/ui';
import { useCollections } from '../../src/context/CollectionsContext';
import { useReader } from '../../src/context/ReaderContext';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing } from '../../src/theme/tokens';

/** One collection. Opens into the full-screen reader, exactly like the feed. */
export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { collections, removeFromCollection } = useCollections();
  const { openReader } = useReader();

  const collection = collections.find((c) => c.id === id);

  if (!collection) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.backgroundGrouped,
          padding: spacing[6],
        }}
      >
        <AppText variant="h3">Collection not found</AppText>
        <Button
          title="Back to collections"
          onPress={() => router.replace('/collections')}
          style={{ marginTop: spacing[5] }}
        />
      </View>
    );
  }

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
          accessibilityLabel="Back to collections"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
        >
          <ChevronLeft size={18} color={colors.mutedForeground} />
          <AppText variant="muted">Collections</AppText>
        </Pressable>

        <AppText
          variant="h1"
          style={{ marginTop: spacing[4] }}
          numberOfLines={2}
        >
          {collection.name}
        </AppText>
        <AppText variant="muted" style={{ marginTop: spacing[1] }}>
          {collection.messages.length}{' '}
          {collection.messages.length === 1 ? 'letter' : 'letters'} · long press
          one to remove it
        </AppText>
      </View>

      <FlatList
        data={collection.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{
          padding: spacing[5],
          paddingBottom: spacing[16],
        }}
        renderItem={({ item, index }) => (
          <Pressable
            onLongPress={() => removeFromCollection(collection.id, item.id)}
            accessibilityHint="Long press to remove from this collection"
          >
            <LetterCard
              message={item}
              onPress={() => {
                // Hands the whole collection to the reader so you can swipe
                // through everything you kept, not just the one you tapped.
                openReader(collection.messages, index);
                router.push('/read');
              }}
              showRecipient
              onPressRecipient={() =>
                router.push(`/bottle/${encodeURIComponent(item.recipient)}`)
              }
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing[12], alignItems: 'center' }}>
            <AppText variant="muted" style={{ textAlign: 'center' }}>
              Nothing in here yet.
            </AppText>
          </View>
        }
      />
    </View>
  );
}
