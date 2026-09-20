import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';

/**
 * A profile picture that never leaves the phone.
 *
 * Everyone here is anonymous and most people have no account at all, so there
 * is nothing to attach an avatar to server-side — and uploading one would
 * quietly turn an anonymous app into one that holds pictures of its users.
 * This is purely for the person holding the phone: their own corner of the app
 * looks like theirs.
 *
 * The picked file is copied into the app's document directory rather than
 * storing the picker's URI directly. Those URIs point into a cache the OS is
 * free to clear, so a stored one works today and renders as a broken image
 * next week.
 */
const STORAGE_KEY = 'miab_avatar_uri';
const FILE_NAME = 'avatar.jpg';

interface LocalAvatar {
  uri: string | null;
  isReady: boolean;
  /** Opens the library, copies the choice locally, and saves it. */
  pick: () => Promise<void>;
  remove: () => Promise<void>;
  /** Set when the picker was denied or the copy failed. */
  error: string | null;
}

export function useLocalAvatar(): LocalAvatar {
  const [uri, setUri] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (stored) => {
        if (cancelled || !stored) return;
        // The file can disappear — app reinstalled, storage cleared, restored
        // from a backup that excluded it. Checking beats rendering a broken
        // image forever.
        const info = await FileSystem.getInfoAsync(stored).catch(() => null);
        if (!cancelled && info?.exists) setUri(stored);
        else if (!cancelled) AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      })
      .catch(() => {
        /* unreadable — carry on without an avatar */
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pick = useCallback(async () => {
    setError(null);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          'Photo access is off for this app. You can turn it on in Settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const source = result.assets[0].uri;
      const destination = `${FileSystem.documentDirectory}${FILE_NAME}`;

      // Always the same filename, so replacing an avatar cannot accumulate
      // orphaned copies. Delete first — copyAsync will not overwrite.
      await FileSystem.deleteAsync(destination, { idempotent: true }).catch(
        () => {}
      );
      await FileSystem.copyAsync({ from: source, to: destination });

      // Cache-bust so the <Image> reloads rather than showing the old file
      // from memory at an identical path.
      const versioned = `${destination}?v=${Date.now()}`;
      setUri(versioned);
      await AsyncStorage.setItem(STORAGE_KEY, versioned);
    } catch (e) {
      console.error('Avatar pick failed:', e);
      setError("That image couldn't be saved. Try another one.");
    }
  }, []);

  const remove = useCallback(async () => {
    setUri(null);
    setError(null);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    await FileSystem.deleteAsync(
      `${FileSystem.documentDirectory}${FILE_NAME}`,
      { idempotent: true }
    ).catch(() => {});
  }, []);

  return { uri, isReady, pick, remove, error };
}
