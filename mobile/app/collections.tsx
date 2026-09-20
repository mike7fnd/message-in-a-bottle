import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, FolderPlus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, Input, Separator } from '../src/components/ui';
import { useCollections } from '../src/context/CollectionsContext';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing } from '../src/theme/tokens';

/** Index of the reader's collections — Pinterest's boards list. */
export default function CollectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { collections, createCollection, deleteCollection } = useCollections();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const submit = useCallback(() => {
    if (createCollection(name)) {
      setName('');
      setCreating(false);
    }
  }, [createCollection, name]);

  const confirmDelete = useCallback(
    (id: string, label: string) =>
      Alert.alert(
        `Delete "${label}"?`,
        'The letters themselves stay in the ocean — only this collection goes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteCollection(id),
          },
        ]
      ),
    [deleteCollection]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingTop: insets.top + spacing[2],
        paddingBottom: spacing[16],
      }}
    >
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
        Collections
      </AppText>
      <AppText variant="muted" style={{ marginTop: spacing[1] }}>
        Letters you wanted to keep. Stored on this phone only.
      </AppText>

      {creating ? (
        <Card style={{ marginTop: spacing[5] }}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Name this collection"
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel="Collection name"
          />
          <View
            style={{
              flexDirection: 'row',
              gap: spacing[2],
              marginTop: spacing[3],
            }}
          >
            <Button title="Create" onPress={submit} style={{ flex: 1 }} />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setCreating(false)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : (
        <Button
          title="New collection"
          variant="outline"
          icon={<FolderPlus size={16} color={colors.foreground} />}
          onPress={() => setCreating(true)}
          fullWidth
          style={{ marginTop: spacing[5] }}
        />
      )}

      {collections.length === 0 ? (
        <AppText
          variant="muted"
          style={{ textAlign: 'center', paddingVertical: spacing[12] }}
        >
          Nothing saved yet. Tap the bookmark on any letter to start one.
        </AppText>
      ) : (
        <Card style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}>
          {collections.map((c, i) => (
            <View key={c.id}>
              {i > 0 && <Separator />}
              <Pressable
                onPress={() => router.push(`/collection/${c.id}`)}
                onLongPress={() => confirmDelete(c.id, c.name)}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${c.messages.length} letters`}
                accessibilityHint="Long press to delete this collection"
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing[4],
                  },
                  pressed ? { opacity: 0.6 } : null,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{c.name}</AppText>
                  <AppText variant="small">
                    {c.messages.length}{' '}
                    {c.messages.length === 1 ? 'letter' : 'letters'}
                  </AppText>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
