import { Bell } from 'lucide-react-native';
import React, { memo } from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { AppText } from './ui';

/**
 * One bottle in the ocean.
 *
 * Ported from the web's `RecipientCard`, including its glow: a second,
 * illuminated artwork stacked over the default one and cross-faded in, while
 * the pair lifts and tilts. The web triggers it on hover; a phone has no hover,
 * so touch is the equivalent — the glow rides the press.
 *
 * Both images are always mounted rather than swapped on press. Swapping would
 * mean the glow art starts downloading at the moment of the tap and arrives
 * after the navigation, so the effect would never actually be seen the first
 * time. Mounted and transparent, it is already decoded when the finger lands.
 *
 * The animation lives on the UI thread, so it survives the JS work of the
 * route transition that a tap kicks off.
 */

/** Matches the web's `duration-200` lift and `duration-300` glow fade. */
const LIFT_MS = 200;
const GLOW_IN_MS = 200;
const GLOW_OUT_MS = 300;

/** `group-hover:scale-110 group-hover:rotate-6`, verbatim. */
const PRESSED_SCALE = 1.1;
const PRESSED_ROTATE = '6deg';

export interface BottleTileProps {
  name: string;
  messageCount: number;
  /** Suffix after the count, from the CMS (e.g. "new message"). */
  countLabel: string;
  /** Default artwork for the active theme. Empty string renders nothing. */
  imageUri: string;
  /** Illuminated artwork for the active theme. */
  glowUri: string;
  size: number;
  followed: boolean;
  /** One column on a phone, two on a tablet. */
  fullWidth: boolean;
  onPress: () => void;
}

function BottleTileBase({
  name,
  messageCount,
  countLabel,
  imageUri,
  glowUri,
  size,
  followed,
  fullWidth,
  onPress,
}: BottleTileProps) {
  const { colors } = useTheme();

  // 0 = at rest, 1 = held.
  const press = useSharedValue(0);

  const artStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + press.value * (PRESSED_SCALE - 1) },
      { rotate: `${press.value * parseFloat(PRESSED_ROTATE)}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: press.value }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(1, {
          duration: Math.min(LIFT_MS, GLOW_IN_MS),
          easing: Easing.out(Easing.quad),
        });
      }}
      onPressOut={() => {
        press.value = withTiming(0, {
          duration: GLOW_OUT_MS,
          easing: Easing.out(Easing.quad),
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${messageCount} messages${
        followed ? ', following' : ''
      }`}
      style={[
        {
          alignItems: 'center',
          paddingVertical: spacing[6],
          paddingHorizontal: spacing[2],
        },
        fullWidth ? { width: '100%' } : { flex: 0.5 },
      ]}
    >
      {/* The glow art bleeds past the bottle's own edges, so the box it lives
          in gets no clipping and the lift scales the whole stack together. */}
      <Animated.View style={[{ width: size, height: size }, artStyle]}>
        {!!imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        )}
        {!!glowUri && (
          <Animated.Image
            source={{ uri: glowUri }}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                width: size,
                height: size,
              },
              glowStyle,
            ]}
            resizeMode="contain"
            // Decorative: it is the same bottle, lit. Announcing it twice would
            // make every tile read as two objects.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        )}
      </Animated.View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          marginTop: spacing[2],
        }}
      >
        {followed && <Bell size={14} color={colors.mutedForeground} />}
        <AppText
          variant="h3"
          style={{ textTransform: 'capitalize' }}
          numberOfLines={1}
        >
          {name}
        </AppText>
      </View>

      <AppText variant="small" style={{ marginTop: spacing[1] }}>
        {messageCount} {countLabel}
        {messageCount > 1 ? 's' : ''}
      </AppText>
    </Pressable>
  );
}

export const BottleTile = memo(BottleTileBase);
