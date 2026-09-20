import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Home, Search, Send, User } from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';

/**
 * Bottom tabs: Home, Send, Browse, Profile — the same four, in the same order,
 * as the web app's mobile nav.
 *
 * Icon-only, with no labels, matching the web. The active item is marked the
 * way the web marks it: a heavier stroke and the primary colour, with no filled
 * icon and no pill behind it.
 *
 * The bar is translucent. That means it has to be absolutely positioned so
 * content scrolls underneath — which in turn is why every tab screen pads its
 * bottom by TAB_BAR_HEIGHT, otherwise the last row would sit under the blur.
 */

/** Visual height of the bar, excluding the safe-area inset below it. */
export const TAB_BAR_HEIGHT = 56;

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  /**
   * Tab items are flex children that share whatever width the bar leaves them,
   * so the only way to pull the icons together is to take width away. This
   * keeps the group to roughly the middle two-thirds of the screen — clustered
   * and centred rather than pinned to the corners — and scales with the device
   * instead of being a fixed inset that looks wrong on a tablet.
   */
  const groupInset = Math.min(Math.max(width * 0.17, 28), 160);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          // The blur supplies the surface; a solid colour here would defeat it.
          backgroundColor: 'transparent',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
          elevation: 0, // Android draws its own shadow otherwise
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: groupInset,
        },
        tabBarItemStyle: {
          // No label means the icon should sit centred in the full bar height.
          height: TAB_BAR_HEIGHT,
          paddingTop: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'android' ? (
            // Android's blur is expensive and can be janky behind a scrolling
            // list, so it gets a high-opacity translucent fill instead — the
            // same visual weight without the frame drops.
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(10,10,10,0.92)'
                    : 'rgba(255,255,255,0.92)',
                },
              ]}
            />
          ) : (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={26} color={color} strokeWidth={focused ? 1.9 : 1.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarAccessibilityLabel: 'Send a message',
          tabBarIcon: ({ color, focused }) => (
            <Send size={26} color={color} strokeWidth={focused ? 1.9 : 1.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarAccessibilityLabel: 'Browse bottles',
          tabBarIcon: ({ color, focused }) => (
            <Search size={26} color={color} strokeWidth={focused ? 1.9 : 1.4} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={26} color={color} strokeWidth={focused ? 1.9 : 1.4} />
          ),
        }}
      />
    </Tabs>
  );
}
