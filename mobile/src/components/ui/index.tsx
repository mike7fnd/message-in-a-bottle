import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextProps,
  type ViewProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, fontSize, radius, spacing } from '../../theme/tokens';

/**
 * The native equivalents of the shadcn/Radix primitives the web app uses.
 *
 * None of those components work in React Native — they are DOM-based — so each
 * is rebuilt here against the same tokens, keeping the variants, radii and
 * type scale identical. This is the whole reason the app can look like the web
 * without being a wrapper around it.
 */

// ── Typography ───────────────────────────────────────────────────────────────

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'muted'
  | 'small'
  | 'quote'
  | 'display';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  /** Overrides the variant's colour. */
  color?: string;
}

export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const variantStyle: Record<TypographyVariant, TextStyle> = {
    h1: {
      fontFamily: fonts.headline,
      fontSize: fontSize['3xl'],
      color: colors.foreground,
      letterSpacing: -0.8,
    },
    h2: {
      fontFamily: fonts.headline,
      fontSize: fontSize['2xl'],
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    h3: {
      fontFamily: fonts.headline,
      fontSize: fontSize.lg,
      color: colors.foreground,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    muted: {
      fontFamily: fonts.body,
      fontSize: fontSize.sm,
      color: colors.mutedForeground,
    },
    small: {
      fontFamily: fonts.body,
      fontSize: fontSize.xs,
      color: colors.mutedForeground,
    },
    // Message bodies, mirroring the web's <blockquote> italic treatment.
    quote: {
      fontFamily: fonts.playfairItalic,
      fontStyle: 'italic',
      fontSize: fontSize.base,
      lineHeight: 24,
      color: colors.foreground,
    },
    display: {
      fontFamily: fonts.abril,
      fontSize: fontSize['5xl'],
      color: colors.primary,
      letterSpacing: -1.5,
    },
  };

  return (
    <Text
      style={[variantStyle[variant], color ? { color } : null, style]}
      {...rest}
    />
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Rendered before the label. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Button({
  title,
  variant = 'default',
  size = 'default',
  loading = false,
  icon,
  fullWidth,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const surface: Record<ButtonVariant, ViewStyle> = {
    default: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: colors.destructive },
    link: { backgroundColor: 'transparent' },
  };

  const label: Record<ButtonVariant, string> = {
    default: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    outline: colors.foreground,
    ghost: colors.foreground,
    destructive: colors.destructiveForeground,
    link: colors.primary,
  };

  const sizing: Record<ButtonSize, ViewStyle> = {
    sm: { height: 36, paddingHorizontal: spacing[3] },
    default: { height: 44, paddingHorizontal: spacing[4] },
    lg: { height: 52, paddingHorizontal: spacing[6] },
    icon: { height: 44, width: 44, paddingHorizontal: 0 },
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        surface[variant],
        sizing[size],
        // rounded-30px on anything interactive, per the design system.
        { borderRadius: variant === 'link' ? 0 : radius.pill },
        fullWidth ? { alignSelf: 'stretch', width: '100%' } : null,
        pressed && !isDisabled ? { opacity: 0.85 } : null,
        isDisabled ? { opacity: 0.5 } : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={label[variant]} />
      ) : (
        <>
          {icon}
          {title ? (
            <Text
              style={[
                styles.buttonLabel,
                { color: label[variant] },
                icon ? { marginLeft: spacing[2] } : null,
                variant === 'link' ? { textDecorationLine: 'underline' } : null,
                size === 'lg' ? { fontSize: fontSize.base } : null,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {children}
        </>
      )}
    </Pressable>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.pill,
          padding: spacing[6],
        },
        style,
      ]}
      {...rest}
    />
  );
}

// ── Input ────────────────────────────────────────────────────────────────────

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { style, invalid, ...rest },
  ref
) {
  const { colors } = useTheme();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.mutedForeground}
      style={[
        {
          height: 48,
          borderWidth: 1,
          borderColor: invalid ? colors.destructive : colors.input,
          borderRadius: radius.pill,
          paddingHorizontal: spacing[4],
          color: colors.foreground,
          backgroundColor: colors.background,
          fontFamily: fonts.body,
          fontSize: fontSize.base,
        },
        style,
      ]}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<TextInput, InputProps>(function Textarea(
  { style, invalid, ...rest },
  ref
) {
  const { colors } = useTheme();
  return (
    <TextInput
      ref={ref}
      multiline
      textAlignVertical="top"
      placeholderTextColor={colors.mutedForeground}
      style={[
        {
          minHeight: 140,
          borderWidth: 1,
          borderColor: invalid ? colors.destructive : colors.input,
          borderRadius: radius.container,
          padding: spacing[4],
          color: colors.foreground,
          backgroundColor: colors.background,
          fontFamily: fonts.body,
          fontSize: fontSize.base,
          lineHeight: 22,
        },
        style,
      ]}
      {...rest}
    />
  );
});

// ── Label ────────────────────────────────────────────────────────────────────

export function Label({ style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: fonts.bodyBold,
          fontSize: fontSize.sm,
          color: colors.foreground,
          marginBottom: spacing[2],
        },
        style,
      ]}
      {...rest}
    />
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.muted, borderRadius: radius.chip },
        style,
      ]}
      {...rest}
    />
  );
}

// ── Separator ────────────────────────────────────────────────────────────────

export function Separator({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ height: 1, backgroundColor: colors.border }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.sm,
  },
});
