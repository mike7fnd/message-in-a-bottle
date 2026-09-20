import { Check, FolderPlus, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCollections } from '../context/CollectionsContext';
import type { Message } from '../lib/data';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText, Button, Input, Separator } from './ui';

/**
 * "Save to…" — Pinterest's board picker.
 *
 * Opened with a message and dismissed with null. Creating a collection from
 * inside the sheet saves the letter straight into it, so the first save never
 * takes two trips.
 */
export interface SaveToCollectionSheetProps {
  message: Message | null;
  onClose: () => void;
}

export function SaveToCollectionSheet({
  message,
  onClose,
}: SaveToCollectionSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    collections,
    createCollection,
    addToCollection,
    removeFromCollection,
    collectionsContaining,
  } = useCollections();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  /**
   * Presentation is animated by hand rather than with Modal's `animationType`.
   *
   * The built-in "slide" moves the whole modal, scrim included, so the black
   * dim arrives already at full strength and travels up with the sheet — it
   * reads as one solid panel being dragged over the screen. Fading the dim
   * while the sheet slides is what makes it feel like a layer settling above
   * the page instead.
   *
   * `mounted` lags `visible` on the way out so the exit animation can finish
   * before the Modal unmounts; without it the sheet would vanish instantly.
   */
  const visible = message !== null;
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, anim]);

  const containing = message ? collectionsContaining(message.id) : [];

  const confirmCreate = useCallback(() => {
    if (!message) return;
    const id = createCollection(name);
    if (!id) return;
    addToCollection(id, message);
    setName('');
    setCreating(false);
  }, [message, name, createCollection, addToCollection]);

  const close = useCallback(() => {
    setCreating(false);
    setName('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={close}
    >
      <View style={{ flex: 1 }}>
        {/* Dim. Fades independently of the sheet, and takes the tap that
            dismisses. */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}
        >
          <Pressable
            onPress={close}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View
          style={{
            marginTop: 'auto',
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: spacing[5],
            paddingBottom: insets.bottom + spacing[5],
            paddingHorizontal: spacing[5],
            maxHeight: '72%',
            transform: [
              {
                // Overshoots the sheet's own height so it is fully off-screen
                // at rest, whatever it ends up measuring.
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              },
            ],
          }}
        >
          {/* Grab handle */}
          <View
            style={{
              alignSelf: 'center',
              width: 38,
              height: 4,
              borderRadius: radius.full,
              backgroundColor: colors.border,
              marginBottom: spacing[5],
            }}
          />

          <AppText variant="h3">Save to a collection</AppText>
          <AppText variant="small" style={{ marginTop: spacing[1] }}>
            Collections stay on this phone. Nobody else can see what you keep.
          </AppText>

          {creating ? (
            <View style={{ marginTop: spacing[5] }}>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Name this collection"
                autoFocus
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={confirmCreate}
                accessibilityLabel="Collection name"
              />
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing[2],
                  marginTop: spacing[3],
                }}
              >
                <Button
                  title="Create and save"
                  onPress={confirmCreate}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setCreating(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
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

          <ScrollView style={{ marginTop: spacing[4] }}>
            {collections.length === 0 && !creating && (
              <AppText
                variant="muted"
                style={{ textAlign: 'center', paddingVertical: spacing[8] }}
              >
                No collections yet. Make one above and this letter goes straight
                into it.
              </AppText>
            )}

            {collections.map((c, i) => {
              const has = containing.includes(c.id);
              return (
                <View key={c.id}>
                  {i > 0 && <Separator />}
                  <Pressable
                    onPress={() => {
                      if (!message) return;
                      if (has) removeFromCollection(c.id, message.id);
                      else addToCollection(c.id, message);
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: has }}
                    accessibilityLabel={c.name}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: spacing[4],
                        gap: spacing[3],
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
                    {has ? (
                      <Check size={20} color={colors.foreground} />
                    ) : (
                      <Plus size={20} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
