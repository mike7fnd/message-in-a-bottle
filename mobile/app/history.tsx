import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, Skeleton, Textarea } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import {
  deleteMessageCached,
  editMessageCached,
  getCachedMessagesForUser,
} from '../src/lib/cached-data';
import type { Message } from '../src/lib/data';
import { describeLoadError } from '../src/lib/errors';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing } from '../src/theme/tokens';

/**
 * The signed-in user's own sent messages, with edit and delete.
 *
 * Only reachable with a real account. An anonymous message carries no senderId
 * at all, which is the point of the product — so there is genuinely nothing to
 * list for an anonymous user, and the screen says that rather than showing an
 * empty state that looks broken.
 *
 * Edit is limited to the message body: the Firestore rules permit `content` and
 * nothing else on update, so offering to change the recipient would fail at the
 * database.
 */
export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous, isLoading: authLoading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!user || isAnonymous) {
        setIsLoading(false);
        return;
      }
      setError(null);
      try {
        const data = await getCachedMessagesForUser(
          user.uid,
          (fresh) => setMessages(fresh),
          force
        );
        setMessages(data);
      } catch (e) {
        console.error('Failed to load history:', e);
        setError(describeLoadError(e).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user, isAnonymous]
  );

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const saveEdit = useCallback(
    async (message: Message) => {
      const next = draft.trim();
      if (!next) {
        Alert.alert('Empty message', 'Write something, or delete it instead.');
        return;
      }
      setBusyId(message.id);
      try {
        await editMessageCached(
          message.id,
          next,
          message.recipient,
          user?.uid
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, content: next } : m))
        );
        setEditingId(null);
      } catch (e) {
        console.error('Edit failed:', e);
        Alert.alert(
          "Couldn't save",
          'The change was not saved. Check your connection and try again.'
        );
      } finally {
        setBusyId(null);
      }
    },
    [draft, user]
  );

  const confirmDelete = useCallback(
    (message: Message) => {
      Alert.alert(
        'Delete this message?',
        'It will be removed from the ocean for everyone. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setBusyId(message.id);
              try {
                await deleteMessageCached(
                  message.id,
                  message.recipient,
                  user?.uid
                );
                setMessages((prev) =>
                  prev.filter((m) => m.id !== message.id)
                );
              } catch (e) {
                console.error('Delete failed:', e);
                Alert.alert(
                  "Couldn't delete",
                  'The message is still there. Try again in a moment.'
                );
              } finally {
                setBusyId(null);
              }
            },
          },
        ]
      );
    },
    [user]
  );

  const header = (
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
        Your bottles
      </AppText>
      <AppText variant="muted" style={{ marginTop: spacing[1] }}>
        Messages you sent while signed in. Only you can see this list.
      </AppText>
    </View>
  );

  // Signed out / anonymous
  if (!authLoading && (isAnonymous || !user)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
          paddingTop: insets.top,
        }}
      >
        {header}
        <View style={{ padding: spacing[5], marginTop: spacing[6] }}>
          <Card>
            <AppText variant="h3">Nothing to show yet</AppText>
            <AppText variant="muted" style={{ marginTop: spacing[2] }}>
              Anonymous messages carry no identifier, so there is no way to know
              which ones are yours. Sign in first, and everything you send from
              then on will appear here.
            </AppText>
            <Button
              title="Sign in"
              onPress={() => router.push('/auth')}
              fullWidth
              style={{ marginTop: spacing[5] }}
            />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: colors.backgroundGrouped,
        paddingTop: insets.top,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {isLoading ? (
        <>
          {header}
          <View style={{ padding: spacing[5], gap: spacing[5] }}>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <Skeleton style={{ height: 14, width: '60%' }} />
                <Skeleton
                  style={{ height: 14, width: '100%', marginTop: spacing[3] }}
                />
              </Card>
            ))}
          </View>
        </>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={header}
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
          renderItem={({ item }) => {
            const isEditing = editingId === item.id;
            const isBusy = busyId === item.id;

            return (
              <Card style={{ marginBottom: spacing[4] }}>
                <AppText variant="muted" style={{ textTransform: 'capitalize' }}>
                  For {item.recipient}
                </AppText>

                {isEditing ? (
                  <>
                    <Textarea
                      value={draft}
                      onChangeText={setDraft}
                      editable={!isBusy}
                      style={{ marginTop: spacing[3], minHeight: 110 }}
                      accessibilityLabel="Edit message"
                    />
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: spacing[2],
                        marginTop: spacing[3],
                      }}
                    >
                      <Button
                        title="Save"
                        size="sm"
                        onPress={() => saveEdit(item)}
                        loading={isBusy}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Cancel"
                        size="sm"
                        variant="outline"
                        onPress={() => setEditingId(null)}
                        disabled={isBusy}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => router.push(`/message/${item.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel="Open this message"
                    >
                      <View
                        style={{
                          borderLeftWidth: 2,
                          borderLeftColor: colors.border,
                          paddingLeft: spacing[4],
                          marginTop: spacing[3],
                        }}
                      >
                        <AppText variant="quote" numberOfLines={4}>
                          {item.content}
                        </AppText>
                      </View>
                    </Pressable>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: spacing[4],
                      }}
                    >
                      <AppText variant="small">
                        {item.timestamp
                          ? format(item.timestamp, 'MMM d, yyyy')
                          : ''}
                      </AppText>
                      <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                        <Pressable
                          onPress={() => {
                            setEditingId(item.id);
                            setDraft(item.content);
                          }}
                          hitSlop={10}
                          disabled={isBusy}
                          accessibilityRole="button"
                          accessibilityLabel="Edit this message"
                        >
                          <Pencil size={18} color={colors.mutedForeground} />
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(item)}
                          hitSlop={10}
                          disabled={isBusy}
                          accessibilityRole="button"
                          accessibilityLabel="Delete this message"
                        >
                          <Trash2 size={18} color={colors.destructive} />
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing[12], alignItems: 'center' }}>
              <AppText variant="muted" style={{ textAlign: 'center' }}>
                {error ?? "You haven't sent anything while signed in yet."}
              </AppText>
              {!error && (
                <Button
                  title="Send your first message"
                  onPress={() => router.push('/send')}
                  style={{ marginTop: spacing[5] }}
                />
              )}
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}
