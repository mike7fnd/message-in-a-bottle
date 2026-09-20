import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { AppText, Button, Card, Input, Label } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing } from '../src/theme/tokens';

/**
 * Sign in / create account.
 *
 * An account is never required — sending and reading work anonymously. What it
 * buys you is the ability to see and manage what you have sent, because a
 * signed-in message carries your uid and an anonymous one carries nothing.
 * The screen says so, rather than implying you must register.
 */
const Credentials = z.object({
  email: z.string().trim().email('That does not look like an email address.'),
  password: z
    .string()
    .min(6, 'Firebase requires at least 6 characters.')
    .max(128, 'That password is too long.'),
});

type Mode = 'signin' | 'signup';

/** Turns Firebase's error codes into something a person can act on. */
function friendlyAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password.';
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please choose a longer password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No connection. Check your network and try again.';
    default:
      return 'That did not work. Please try again.';
  }
}

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, isAnonymous } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setErrors({});
    setFormError(null);

    const parsed = Credentials.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(parsed.data.email, parsed.data.password);
      } else {
        await signUp(
          parsed.data.email,
          parsed.data.password,
          displayName.trim() || undefined
        );
      }
      // Replace rather than push: returning to the auth screen with the back
      // gesture after signing in would be confusing.
      router.replace('/profile');
    } catch (err) {
      console.error('Auth failed:', err);
      setFormError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }, [mode, email, password, displayName, signIn, signUp, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingTop: insets.top + spacing[3],
          paddingBottom: spacing[16],
        }}
        keyboardShouldPersistTaps="handled"
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

        <AppText variant="h1" style={{ marginTop: spacing[5] }}>
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </AppText>
        <AppText variant="muted" style={{ marginTop: spacing[2] }}>
          You don&apos;t need an account to send or read messages. Signing in
          just lets you see and manage the bottles you&apos;ve sent.
        </AppText>

        {/* Mode switch */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.muted,
            borderRadius: radius.pill,
            padding: 4,
            marginTop: spacing[5],
          }}
        >
          {(['signin', 'signup'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setErrors({});
                  setFormError(null);
                }}
                accessibilityRole="tab"
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
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Card style={{ marginTop: spacing[5] }}>
          {mode === 'signup' && (
            <>
              <Label>Display name (optional)</Label>
              <Input
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="What should we call you?"
                autoCapitalize="words"
                maxLength={40}
                editable={!busy}
                accessibilityLabel="Display name"
              />
              <View style={{ height: spacing[4] }} />
            </>
          )}

          <Label>Email</Label>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!busy}
            invalid={!!errors.email}
            accessibilityLabel="Email address"
          />
          {errors.email && (
            <AppText
              variant="small"
              color={colors.destructive}
              style={{ marginTop: spacing[1] }}
            >
              {errors.email.join(' ')}
            </AppText>
          )}

          <Label style={{ marginTop: spacing[4] }}>Password</Label>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            textContentType={mode === 'signin' ? 'password' : 'newPassword'}
            editable={!busy}
            invalid={!!errors.password}
            accessibilityLabel="Password"
            onSubmitEditing={submit}
            returnKeyType="go"
          />
          {errors.password && (
            <AppText
              variant="small"
              color={colors.destructive}
              style={{ marginTop: spacing[1] }}
            >
              {errors.password.join(' ')}
            </AppText>
          )}

          {formError && (
            <AppText
              variant="small"
              color={colors.destructive}
              style={{ marginTop: spacing[4] }}
              accessibilityRole="alert"
            >
              {formError}
            </AppText>
          )}

          <Button
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            onPress={submit}
            loading={busy}
            fullWidth
            style={{ marginTop: spacing[6] }}
          />
        </Card>

        {isAnonymous && (
          <AppText
            variant="small"
            style={{ textAlign: 'center', marginTop: spacing[5] }}
          >
            Messages you already sent anonymously stay anonymous — they carry no
            identifier, so they cannot be linked to a new account.
          </AppText>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
