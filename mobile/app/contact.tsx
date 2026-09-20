import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Mail, Send as SendIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, Button, Card, Input, Label, Textarea } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { addFeedback } from '../src/lib/data';
import { siteConfig } from '../src/lib/site-config';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing } from '../src/theme/tokens';

/**
 * Contact — the same routes the web contact page offers, writing to the same
 * Firestore `feedback` collection the operator already reads in the admin
 * panel. Nothing new to check, so nothing gets missed.
 */
const TOPICS = [
  { value: 'report', label: 'Report a message' },
  { value: 'removal', label: 'Remove a message' },
  { value: 'privacy', label: 'Privacy request' },
  { value: 'copyright', label: 'Copyright' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'other', label: 'Something else' },
] as const;

const ContactSchema = z.object({
  topic: z.string().min(1, 'Pick what this is about.'),
  email: z
    .string()
    .trim()
    .email('That does not look like an email address.')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, 'Please give a bit more detail — at least 20 characters.')
    .max(4000, 'Please keep this under 4000 characters.'),
});

const COOLDOWN_KEY = 'miab_contact_last_sent';
const COOLDOWN_MS = 5 * 60 * 1000;
/** A real person takes longer than this to read the form and type. */
const MIN_FILL_MS = 3000;

export default function ContactScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [topic, setTopic] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const mountedAt = useRef(Date.now());
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const submit = useCallback(async () => {
    setErrors({});
    setFormError(null);

    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setFormError('That was very quick — take a moment and try again.');
      return;
    }

    const parsed = ContactSchema.safeParse({ topic, email, message });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    try {
      const last = await AsyncStorage.getItem(COOLDOWN_KEY);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) {
        const mins = Math.ceil(
          (COOLDOWN_MS - (Date.now() - Number(last))) / 60000
        );
        setFormError(
          `You've just sent one. Wait about ${mins} minute${mins === 1 ? '' : 's'}, or email directly.`
        );
        return;
      }
    } catch {
      /* storage unavailable — carry on without the cooldown */
    }

    if (!user) {
      setFormError('Still starting up — try again in a second.');
      return;
    }

    setBusy(true);
    try {
      const label =
        TOPICS.find((t) => t.value === parsed.data.topic)?.label ??
        parsed.data.topic;
      // The reply address goes into the body as well, so it appears in the
      // operator's existing feedback view rather than a field he never reads.
      const replyLine = parsed.data.email
        ? `Reply to: ${parsed.data.email}`
        : 'Reply to: (not provided)';

      await addFeedback(
        `[${label}] (from mobile)\n${replyLine}\n\n${parsed.data.message}`,
        parsed.data.topic,
        user.uid
      );

      await AsyncStorage.setItem(COOLDOWN_KEY, String(Date.now())).catch(
        () => {}
      );
      setSent(true);
      setMessage('');
      setEmail('');
      setTopic('');
    } catch (e) {
      console.error('Contact submission failed:', e);
      setFormError(
        'That did not go through. Please email directly so your message is not lost.'
      );
    } finally {
      setBusy(false);
    }
  }, [topic, email, message, user]);

  const back = (
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
  );

  if (sent) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
        contentContainerStyle={{
          padding: spacing[5],
          paddingTop: insets.top + spacing[2],
        }}
      >
        {back}
        <Card style={{ marginTop: spacing[6] }}>
          <Check size={28} color={colors.foreground} />
          <AppText variant="h3" style={{ marginTop: spacing[3] }}>
            Message received
          </AppText>
          <AppText variant="muted" style={{ marginTop: spacing[2] }}>
            It has been saved to the site&apos;s feedback log, which only{' '}
            {siteConfig.operator} can read. It is not sent as an email, so if you
            need a guaranteed reply, write to {siteConfig.contactEmail} as well.
          </AppText>
          <Button
            title="Send another"
            variant="outline"
            onPress={() => setSent(false)}
            fullWidth
            style={{ marginTop: spacing[5] }}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingTop: insets.top + spacing[2],
          paddingBottom: spacing[16],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {back}

        <AppText variant="h1" style={{ marginTop: spacing[4] }}>
          Contact
        </AppText>
        <AppText variant="muted" style={{ marginTop: spacing[2] }}>
          Run by one person, {siteConfig.operator}. Mail reaches him directly and
          he answers it himself, so please allow a few days.
        </AppText>

        <Pressable
          onPress={() => Linking.openURL(`mailto:${siteConfig.contactEmail}`)}
          accessibilityRole="link"
          accessibilityLabel={`Email ${siteConfig.contactEmail}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
            marginTop: spacing[4],
          }}
          hitSlop={8}
        >
          <Mail size={18} color={colors.mutedForeground} />
          <AppText variant="body" color={colors.primary}>
            {siteConfig.contactEmail}
          </AppText>
        </Pressable>

        <Card style={{ marginTop: spacing[6] }}>
          <Label>What is this about?</Label>
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
          >
            {TOPICS.map((t) => {
              const active = topic === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => setTopic(t.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: spacing[3],
                    paddingVertical: spacing[2],
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : 'transparent',
                  }}
                >
                  <AppText
                    variant="small"
                    color={active ? colors.primaryForeground : colors.foreground}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {errors.topic && (
            <AppText
              variant="small"
              color={colors.destructive}
              style={{ marginTop: spacing[2] }}
            >
              {errors.topic.join(' ')}
            </AppText>
          )}

          <Label style={{ marginTop: spacing[5] }}>
            Your email (optional — only if you want a reply)
          </Label>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            invalid={!!errors.email}
            accessibilityLabel="Your email address"
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

          <Label style={{ marginTop: spacing[5] }}>Your message</Label>
          <Textarea
            value={message}
            onChangeText={setMessage}
            placeholder="If you're reporting or asking to remove a message, please paste its link."
            editable={!busy}
            invalid={!!errors.message}
            accessibilityLabel="Your message"
          />
          {errors.message && (
            <AppText
              variant="small"
              color={colors.destructive}
              style={{ marginTop: spacing[1] }}
            >
              {errors.message.join(' ')}
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
            title="Send message"
            icon={<SendIcon size={16} color={colors.primaryForeground} />}
            onPress={submit}
            loading={busy}
            fullWidth
            style={{ marginTop: spacing[5] }}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
