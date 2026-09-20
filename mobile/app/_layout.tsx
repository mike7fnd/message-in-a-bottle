import {
  AbrilFatface_400Regular,
} from '@expo-google-fonts/abril-fatface';
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeAds } from '../src/lib/ads';
import { AuthProvider } from '../src/context/AuthContext';
import { ConsentProvider } from '../src/context/ConsentContext';
import { ContentProvider } from '../src/context/ContentContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { CollectionsProvider } from '../src/context/CollectionsContext';
import { FollowsProvider } from '../src/context/FollowsContext';
import { NotificationsProvider } from '../src/context/NotificationsContext';
import { ReaderProvider } from '../src/context/ReaderContext';
import { SearchProvider } from '../src/context/SearchContext';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { collectGarbage } from '../src/lib/cache';

// Hold the splash until fonts are ready — the whole design language depends on
// Manrope/Playfair/Abril, so rendering a frame in the system font first looks
// like a different app.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          // Native push transition; the web equivalent is the fade-in on route
          // change, but on a phone a slide reads as hierarchy.
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bottle/[name]" />
        <Stack.Screen name="message/[id]" />
        <Stack.Screen name="history" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="about" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="collections" />
        <Stack.Screen name="collection/[id]" />
        {/* Immersive: no gesture-back competing with the vertical pager. */}
        <Stack.Screen name="read" options={{ animation: 'fade', gestureEnabled: false }} />
        {/* Full-screen, no back gesture — it is a one-time gate, not a page. */}
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        {/* Sign-in slides up rather than across: it interrupts whatever you
            were doing rather than being a place you navigated into. */}
        <Stack.Screen
          name="auth"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="+not-found"
          options={{ animation: 'fade', presentation: 'modal' }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    AbrilFatface_400Regular,
  });

  useEffect(() => {
    // Sweep expired cache entries once per cold start, like the web's
    // CacheProvider does on mount.
    collectGarbage();
    // No-ops when the native ads module is absent, as it is in Expo Go. This
    // must never throw: an earlier version imported the SDK directly at the top
    // of this file, which crashed module evaluation in Expo Go and took the
    // whole provider tree down with it.
    initializeAds();
  }, []);

  const onLayout = useCallback(async () => {
    // Hide the splash on a font error too, otherwise a missing font file
    // leaves the user staring at the splash screen forever.
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ConsentProvider>
              <ContentProvider>
                <FavoritesProvider>
                  <FollowsProvider>
                    <CollectionsProvider>
                      <ReaderProvider>
                        <NotificationsProvider>
                          <SearchProvider>
                            <OnboardingProvider>
                              <RootNavigator />
                            </OnboardingProvider>
                          </SearchProvider>
                        </NotificationsProvider>
                      </ReaderProvider>
                    </CollectionsProvider>
                  </FollowsProvider>
                </FavoritesProvider>
              </ContentProvider>
            </ConsentProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
