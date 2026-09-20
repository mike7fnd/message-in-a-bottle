import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { CalendarDays, Check, Copy, Send as SendIcon, Share2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { z } from 'zod';
import { ShareCard, SHARE_CARD } from '../../src/components/ShareCard';
import { AppText, Button, Card, Input, Label, Textarea } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { useContent } from '../../src/context/ContentContext';
import { useFollows } from '../../src/context/FollowsContext';
import { addMessageCached } from '../../src/lib/cached-data';
import { checkRateLimit, recordMessageSent } from '../../src/lib/rate-limit';
import { siteConfig } from '../../src/lib/site-config';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, spacing } from '../../src/theme/tokens';

/**
 * Send — the app's only write path.
 *
 * Feature parity with the web form: recipient, message body, and the optional
 * time-capsule open date. The web form has no photo or song picker (that UI was
 * removed), so neither does this one; adding them here would advertise
 * something the product does not do.
 */
const FormSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(1, 'Who is this for?')
    .max(50, 'That name is too long.'),
  message: z.string().trim().min(1, 'Write something first.'),
});

export default function SendScreen() {
  const router = useRouter();
  const { content } = useContent();
  const { colors, isDark } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const { noteSentTo } = useFollows();
  const insets = useSafeAreaInsets();
  // The tab bar is translucent and absolutely positioned, so content scrolls
  // beneath it — this keeps the last row clear of the blur.
  const tabBarHeight = useBottomTabBarHeight();

  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [openDate, setOpenDate] = useState<Date | undefined>();
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSending, setIsSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState<string | null>(null);
  const [sentContent, setSentContent] = useState('');
  const [sharingCard, setSharingCard] = useState(false);
  const shareCardRef = useRef<View>(null);

  useEffect(() => {
    checkRateLimit().then((r) => {
      if (!r.allowed) setCooldown(r.retryAfterLabel ?? 'a while');
    });
  }, []);

  const shareUrl = sentId ? `${siteConfig.apiBaseUrl}/message/${sentId}` : '';

  const handleSubmit = useCallback(async () => {
    setErrors({});

    const parsed = FormSchema.safeParse({ recipient, message });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    const limit = await checkRateLimit();
    if (!limit.allowed) {
      setCooldown(limit.retryAfterLabel ?? 'a while');
      return;
    }

    if (authLoading || !user) {
      Alert.alert('Still starting up', 'Give it a second and try again.');
      return;
    }

    setIsSending(true);
    try {
      const id = await addMessageCached(
        parsed.data.message,
        parsed.data.recipient,
        user.uid,
        undefined,
        undefined,
        openDate
      );
      await recordMessageSent();
      // Writing to someone is the strongest personalisation signal there is.
      noteSentTo(parsed.data.recipient);
      setSentId(id);
      // Keep a copy for the share card: `message` is cleared below so the form
      // is empty if they send another, which would otherwise capture a blank
      // card.
      setSentContent(parsed.data.message);
      setMessage('');
      setOpenDate(undefined);
    } catch (e) {
      console.error('Send failed:', e);
      Alert.alert(
        "That didn't send",
        'Check your connection and try again. Nothing was lost — your message is still here.'
      );
    } finally {
      setIsSending(false);
    }
  }, [recipient, message, openDate, user, authLoading, noteSentTo]);

  const copyLink = useCallback(async () => {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  /**
   * Shares the designed 1080×1920 card rather than a bare link — the same
   * asset the web app produces, and the only thing Instagram or TikTok can
   * actually receive. Falls back to a plain link share if the capture fails.
   */
  const shareCardImage = useCallback(async () => {
    setSharingCard(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        width: SHARE_CARD.width * SHARE_CARD.pixelRatio,
        height: SHARE_CARD.height * SHARE_CARD.pixelRatio,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `A message for ${recipient}`,
        });
      } else {
        throw new Error('Sharing unavailable');
      }
    } catch (e) {
      console.error('Card share failed:', e);
      await Share.share({
        message: `A message in a bottle for ${recipient}: ${shareUrl}`,
        url: shareUrl,
      }).catch(() => {});
    } finally {
      setSharingCard(false);
    }
  }, [recipient, shareUrl]);

  const reset = useCallback(() => {
    setSentId(null);
    setRecipient('');
    setMessage('');
    setCopied(false);
  }, []);

  // ── Success state ──────────────────────────────────────────────────────────
  if (sentId) {
    const successUri = isDark
      ? content.sendSuccessImageDark
      : content.sendSuccessImageLight;

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
        contentContainerStyle={{
          padding: spacing[5],
          paddingTop: insets.top + spacing[6],
          paddingBottom: tabBarHeight + spacing[8],
        }}
      >
        <Card style={{ alignItems: 'center' }}>
          {!!successUri && (
            <Image
              source={{ uri: successUri }}
              style={{ width: 128, height: 128 }}
              resizeMode="contain"
            />
          )}
          <AppText variant="h2" style={{ marginTop: spacing[4] }}>
            {content.sendSuccessTitle}
          </AppText>
          <AppText
            variant="muted"
            style={{ textAlign: 'center', marginTop: spacing[2] }}
          >
            {content.sendSuccessDescription}
          </AppText>

          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: radius.chip,
              padding: spacing[3],
              marginTop: spacing[5],
              width: '100%',
            }}
          >
            <AppText variant="small" numberOfLines={1}>
              {shareUrl}
            </AppText>
          </View>

          <View style={{ width: '100%', gap: spacing[2], marginTop: spacing[4] }}>
            <Button
              title={copied ? 'Copied' : content.sendCopyLinkButton}
              icon={
                copied ? (
                  <Check size={16} color={colors.primaryForeground} />
                ) : (
                  <Copy size={16} color={colors.primaryForeground} />
                )
              }
              onPress={copyLink}
              fullWidth
            />
            <Button
              title="Share to story"
              variant="secondary"
              loading={sharingCard}
              icon={<Share2 size={16} color={colors.secondaryForeground} />}
              onPress={shareCardImage}
              fullWidth
            />
            <Button
              title="Open it"
              variant="outline"
              onPress={() => router.push(`/message/${sentId}`)}
              fullWidth
            />
            <Button
              title={content.sendAnotherButton}
              variant="ghost"
              onPress={reset}
              fullWidth
            />
          </View>
        </Card>

        {/* Off-screen capture target for the shareable card. Needs real
            geometry, so it is pushed off-canvas rather than hidden. */}
        <View
          style={{ position: 'absolute', left: -9999, top: 0 }}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ShareCard
            ref={shareCardRef}
            recipient={recipient}
            message={sentContent}
          />
        </View>
      </ScrollView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing[5],
          paddingTop: insets.top + spacing[4],
          paddingBottom: tabBarHeight + spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Not content.sendTitle: that string is "Cast a Message into the
            Ocean", written for a wide web heading, and it wraps to three lines
            on a phone. A single short line reads better here. */}
        <AppText variant="h1" numberOfLines={1} style={{ textAlign: 'center' }}>
          Cast a message
        </AppText>

        <Card style={{ marginTop: spacing[6] }}>
          <Label>{content.sendRecipientLabel}</Label>
          <Input
            value={recipient}
            onChangeText={setRecipient}
            placeholder={content.sendRecipientPlaceholder}
            maxLength={50}
            invalid={!!errors.recipient}
            editable={!isSending}
            accessibilityLabel={content.sendRecipientLabel}
          />
          {/* Moved down from the old page subtitle. This is the one thing
              people get wrong about the product, and it belongs next to the
              field that causes the confusion rather than in a header nobody
              re-reads. */}
          <AppText variant="small" style={{ marginTop: spacing[2] }}>
            Nothing is sent to the person you name — the message is posted
            publicly for anyone to read.
          </AppText>
          {errors.recipient && (
            <AppText variant="small" color={colors.destructive} style={{ marginTop: spacing[1] }}>
              {errors.recipient.join(' ')}
            </AppText>
          )}

          <Label style={{ marginTop: spacing[5] }}>
            {content.sendMessageLabel}
          </Label>
          <Textarea
            value={message}
            onChangeText={setMessage}
            placeholder={content.sendMessagePlaceholder}
            invalid={!!errors.message}
            editable={!isSending}
            accessibilityLabel={content.sendMessageLabel}
          />
          {errors.message && (
            <AppText variant="small" color={colors.destructive} style={{ marginTop: spacing[1] }}>
              {errors.message.join(' ')}
            </AppText>
          )}

          {/* Time capsule */}
          <Label style={{ marginTop: spacing[5] }}>Time capsule (optional)</Label>
          <AppText variant="small">
            Seal the message until a date you choose.
          </AppText>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.pill,
              height: 44,
              marginTop: spacing[2],
            }}
            accessibilityRole="button"
            accessibilityLabel="Set an open date"
          >
            <CalendarDays size={16} color={colors.mutedForeground} />
            <AppText variant={openDate ? 'body' : 'muted'}>
              {openDate ? openDate.toDateString() : 'Set an open date'}
            </AppText>
          </Pressable>
          {openDate && (
            <Button
              title="Clear date"
              variant="ghost"
              size="sm"
              onPress={() => setOpenDate(undefined)}
              style={{ marginTop: spacing[1] }}
            />
          )}

          {showPicker && (
            <DateTimePicker
              value={openDate ?? new Date(Date.now() + 86400000)}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                // Android fires with type 'dismissed' on cancel.
                setShowPicker(Platform.OS === 'ios');
                if (event.type !== 'dismissed' && date) setOpenDate(date);
              }}
            />
          )}

          <Button
            title={content.sendMessageButton}
            icon={<SendIcon size={16} color={colors.primaryForeground} />}
            onPress={handleSubmit}
            loading={isSending}
            disabled={!!cooldown || authLoading}
            fullWidth
            style={{ marginTop: spacing[6] }}
          />

          {cooldown && (
            <AppText
              variant="small"
              style={{ textAlign: 'center', marginTop: spacing[2] }}
            >
              You can send another message in {cooldown}.
            </AppText>
          )}

          {!!content.sendNote && (
            <AppText
              variant="small"
              style={{ textAlign: 'center', marginTop: spacing[3] }}
            >
              {content.sendNote}
            </AppText>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
