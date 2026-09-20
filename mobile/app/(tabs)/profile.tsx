import { useRouter } from 'expo-router';
import {
  Camera,
  ChevronRight,
  Bookmark,
  Heart,
  History,
  Info,
  LogIn,
  LogOut,
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AppText, Button, Card, Separator } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { useCollections } from '../../src/context/CollectionsContext';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useLocalAvatar } from '../../src/hooks/useLocalAvatar';
import { siteConfig } from '../../src/lib/site-config';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, spacing } from '../../src/theme/tokens';

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing[4],
          gap: spacing[4],
        },
        pressed && onPress ? { opacity: 0.6 } : null,
      ]}
    >
      {icon}
      <AppText variant="body" style={{ flex: 1 }}>
        {label}
      </AppText>
      {value ? <AppText variant="muted">{value}</AppText> : null}
      {onPress ? <ChevronRight size={18} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // The tab bar is translucent and absolutely positioned, so content scrolls
  // beneath it — this keeps the last row clear of the blur.
  const tabBarHeight = useBottomTabBarHeight();
  const { user, isAnonymous, signOut } = useAuth();
  const { favorites } = useFavorites();
  const { collections, savedCount } = useCollections();
  const avatar = useLocalAvatar();
  const router = useRouter();

  const iconColor = colors.mutedForeground;

  const confirmSignOut = useCallback(() => {
    Alert.alert(
      'Sign out?',
      "You'll go back to browsing anonymously. Your favorites stay on this device.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            signOut().catch(() =>
              Alert.alert("Couldn't sign out", 'Please try again.')
            );
          },
        },
      ]
    );
  }, [signOut]);

  const initial = (user?.displayName ?? user?.email ?? 'A')
    .charAt(0)
    .toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingTop: insets.top + spacing[4],
        paddingBottom: tabBarHeight + spacing[8],
      }}
    >
      <AppText variant="h1">Profile</AppText>

      {/* Identity */}
      <Card style={{ marginTop: spacing[5], alignItems: 'center' }}>
        <Pressable
          onPress={avatar.pick}
          accessibilityRole="button"
          accessibilityLabel={
            avatar.uri ? 'Change your profile picture' : 'Add a profile picture'
          }
          style={({ pressed }) => [pressed ? { opacity: 0.7 } : null]}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: radius.full,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {avatar.uri ? (
              <Image
                source={{ uri: avatar.uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <AppText variant="h2">{isAnonymous ? '~' : initial}</AppText>
            )}
          </View>

          {/* Camera affordance, so the picture reads as something you can
              change rather than something the app assigned you. */}
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 28,
              height: 28,
              borderRadius: radius.full,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.card,
            }}
          >
            <Camera size={14} color={colors.primaryForeground} />
          </View>
        </Pressable>

        <AppText variant="h3" style={{ marginTop: spacing[4] }}>
          {isAnonymous
            ? 'Browsing anonymously'
            : (user?.displayName ?? 'Signed in')}
        </AppText>
        <AppText
          variant="muted"
          style={{ textAlign: 'center', marginTop: spacing[1] }}
        >
          {isAnonymous
            ? 'You can send and read everything without an account. Sign in to keep track of what you have sent.'
            : (user?.email ?? '')}
        </AppText>

        {avatar.error && (
          <AppText
            variant="small"
            color={colors.destructive}
            style={{ textAlign: 'center', marginTop: spacing[3] }}
          >
            {avatar.error}
          </AppText>
        )}

        {avatar.uri && (
          <Button
            title="Remove picture"
            variant="ghost"
            size="sm"
            onPress={avatar.remove}
            style={{ marginTop: spacing[2] }}
          />
        )}

        {isAnonymous && (
          <Button
            title="Sign in"
            icon={<LogIn size={16} color={colors.primaryForeground} />}
            onPress={() => router.push('/auth')}
            fullWidth
            style={{ marginTop: spacing[5] }}
          />
        )}
      </Card>

      <AppText
        variant="small"
        style={{ textAlign: 'center', marginTop: spacing[3] }}
      >
        Your picture is kept on this phone and never uploaded.
      </AppText>

      {/* Your stuff */}
      <Card style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}>
        <Row
          icon={<Heart size={20} color={iconColor} />}
          label="Favorites"
          value={String(favorites.length)}
          onPress={() => router.push('/favorites')}
        />
        <Separator />
        <Row
          icon={<Bookmark size={20} color={iconColor} />}
          label="Collections"
          value={
            collections.length === 0 ? undefined : `${savedCount} saved`
          }
          onPress={() => router.push('/collections')}
        />
        <Separator />
        <Row
          icon={<History size={20} color={iconColor} />}
          label="Your bottles"
          onPress={() => router.push('/history')}
        />
      </Card>

      {/* Everything else */}
      <Card style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}>
        <Row
          icon={<Info size={20} color={iconColor} />}
          label="About & reviews"
          onPress={() => router.push('/about')}
        />
        <Separator />
        <Row
          icon={<Mail size={20} color={iconColor} />}
          label="Contact"
          onPress={() => router.push('/contact')}
        />
        <Separator />
        <Row
          icon={<SettingsIcon size={20} color={iconColor} />}
          label="Settings & privacy"
          onPress={() => router.push('/settings')}
        />
      </Card>

      {/* Account — last, and on its own.
          Sign out used to sit in the identity card at the top, which put a
          destructive action directly under the thing it destroys. Down here it
          is where you go looking for it, and nowhere near anything you tap by
          habit. */}
      {!isAnonymous && (
        <Card style={{ marginTop: spacing[4], paddingVertical: spacing[2] }}>
          <Row
            icon={<LogOut size={20} color={colors.destructive} />}
            label="Sign out"
            onPress={confirmSignOut}
          />
        </Card>
      )}

      <AppText
        variant="small"
        style={{ textAlign: 'center', marginTop: spacing[8] }}
      >
        © {new Date().getFullYear()} {siteConfig.name}
      </AppText>
    </ScrollView>
  );
}
