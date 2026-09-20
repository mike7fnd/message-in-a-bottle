import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft, FileText, Shield } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, Separator } from '../src/components/ui';
import { useConsent } from '../src/context/ConsentContext';
import { siteConfig } from '../src/lib/site-config';
import { useTheme, type ThemeSetting } from '../src/theme/ThemeProvider';
import { radius, spacing } from '../src/theme/tokens';

/**
 * Settings — appearance, privacy choices and the legal documents.
 *
 * Privacy and Terms open the live web pages rather than being duplicated here.
 * A legal document that exists in two places drifts, and correcting one should
 * never require a store release.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { colors, setting, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { consent, analyticsAllowed, personalisedAdsAllowed, save, withdraw } =
    useConsent();

  const openWeb = (path: string) =>
    WebBrowser.openBrowserAsync(`${siteConfig.apiBaseUrl}${path}`);

  const themeOptions: { value: ThemeSetting; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

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
        Settings
      </AppText>

      {/* Appearance */}
      <AppText variant="h3" style={{ marginTop: spacing[6] }}>
        Appearance
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.muted,
          borderRadius: radius.pill,
          padding: 4,
          marginTop: spacing[3],
        }}
      >
        {themeOptions.map((opt) => {
          const active = setting === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setTheme(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.pill,
                backgroundColor: active ? colors.background : 'transparent',
              }}
            >
              <AppText
                variant="body"
                color={active ? colors.foreground : colors.mutedForeground}
              >
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Privacy */}
      <AppText variant="h3" style={{ marginTop: spacing[8] }}>
        Privacy
      </AppText>
      <Card style={{ marginTop: spacing[3] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing[4],
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="body">Personalised ads</AppText>
            <AppText variant="small" style={{ marginTop: spacing[1] }}>
              The app is free because it carries ads. Leaving this off does not
              remove them — you will see generic ones, chosen without a profile
              of you.
            </AppText>
          </View>
          <Switch
            value={personalisedAdsAllowed}
            onValueChange={(v) =>
              save({ analytics: analyticsAllowed, advertising: v })
            }
            accessibilityLabel="Personalised ads"
          />
        </View>

        <Separator style={{ marginVertical: spacing[4] }} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing[4],
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="body">Analytics</AppText>
            <AppText variant="small" style={{ marginTop: spacing[1] }}>
              Reserved. This app does not currently send any usage analytics, so
              the switch changes nothing today — it is here so the choice is
              already yours if that changes.
            </AppText>
          </View>
          <Switch
            value={analyticsAllowed}
            onValueChange={(v) =>
              save({ analytics: v, advertising: personalisedAdsAllowed })
            }
            accessibilityLabel="Analytics"
          />
        </View>

        <Separator style={{ marginVertical: spacing[4] }} />

        <AppText variant="small">
          Always on: your sign-in session, theme, favorites, the send cooldown
          and the offline cache. The app cannot work without them, and none of
          it leaves your device except the messages you choose to send.
        </AppText>

        {consent && (
          <Button
            title="Reset my choices"
            variant="ghost"
            size="sm"
            onPress={withdraw}
            style={{ marginTop: spacing[4], alignSelf: 'flex-start' }}
          />
        )}
      </Card>

      {/* Legal */}
      <AppText variant="h3" style={{ marginTop: spacing[8] }}>
        Legal
      </AppText>
      <Card style={{ marginTop: spacing[3], paddingVertical: spacing[2] }}>
        <Pressable
          onPress={() => openWeb('/privacy')}
          accessibilityRole="button"
          accessibilityLabel="Privacy Policy"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[4],
            paddingVertical: spacing[4],
          }}
        >
          <Shield size={20} color={colors.mutedForeground} />
          <AppText variant="body">Privacy Policy</AppText>
        </Pressable>
        <Separator />
        <Pressable
          onPress={() => openWeb('/terms')}
          accessibilityRole="button"
          accessibilityLabel="Terms of Service"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[4],
            paddingVertical: spacing[4],
          }}
        >
          <FileText size={20} color={colors.mutedForeground} />
          <AppText variant="body">Terms of Service</AppText>
        </Pressable>
      </Card>

      <AppText
        variant="small"
        style={{ textAlign: 'center', marginTop: spacing[8] }}
      >
        © {new Date().getFullYear()} {siteConfig.name}
      </AppText>
    </ScrollView>
  );
}
