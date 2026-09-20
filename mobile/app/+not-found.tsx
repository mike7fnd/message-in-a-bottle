import { Link, Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../src/components/ui';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing } from '../src/theme/tokens';

/** Native equivalent of the web's "404 — Lost at Sea" page. */
export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Lost at Sea' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
          backgroundColor: colors.background,
        }}
      >
        <AppText variant="h1" style={{ textAlign: 'center' }}>
          Lost at Sea
        </AppText>
        <AppText
          variant="muted"
          style={{ textAlign: 'center', marginTop: spacing[3] }}
        >
          This page drifted away. Let's get you back to shore.
        </AppText>
        <Link href="/" style={{ marginTop: spacing[6] }}>
          <AppText variant="body" color={colors.primary}>
            Return home
          </AppText>
        </Link>
      </View>
    </>
  );
}
