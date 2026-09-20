import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Flag, Lock, Share2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { AdBanner } from '../../src/components/AdBanner';
import { ShareCard, SHARE_CARD } from '../../src/components/ShareCard';
import { SongPlayer } from '../../src/components/SongPlayer';
import { AppText, Button, Card, Skeleton } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { getCachedMessageById } from '../../src/lib/cached-data';
import { addFeedback, type Message } from '../../src/lib/data';
import { AD_UNITS, siteConfig } from '../../src/lib/site-config';
import { describeLoadError } from '../../src/lib/errors';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, spacing } from '../../src/theme/tokens';

/** Live countdown for a sealed message, ported from the web's CountdownTimer. */
function Countdown({ unlockDate }: { unlockDate: Date }) {
  const calc = useCallback(() => {
    const diff = +unlockDate - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [unlockDate]);

  const [left, setLeft] = useState(calc);

  useEffect(() => {
    const t = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);

  return (
    <View style={{ flexDirection: 'row', gap: spacing[5], marginTop: spacing[4] }}>
      {Object.entries(left).map(([unit, value]) => (
        <View key={unit} style={{ alignItems: 'center' }}>
          <AppText variant="h3">{String(value).padStart(2, '0')}</AppText>
          <AppText variant="small" style={{ textTransform: 'uppercase' }}>
            {unit}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [message, setMessage] = useState<Message | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [playSpotify, setPlaySpotify] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const shareCardRef = useRef<View>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getCachedMessageById(id, (fresh) => {
      if (!cancelled && fresh) setMessage(fresh);
    })
      .then((m) => {
        if (!cancelled) setMessage(m ?? null);
      })
      .catch((e) => {
        console.error('Failed to load message:', e);
        if (!cancelled) {
          setLoadError(describeLoadError(e).message);
          setMessage(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const shareUrl = `${siteConfig.apiBaseUrl}/message/${id}`;

  /**
   * Renders the off-screen ShareCard to a PNG and hands it to the system share
   * sheet — which is what lists Instagram and TikTok, the only route to either
   * from outside their apps.
   *
   * Falls back to sharing the plain link if the capture fails, so the button
   * always does something useful.
   */
  const shareAsImage = useCallback(async () => {
    if (!message) return;
    setSharing(true);
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
          dialogTitle: `A message for ${message.recipient}`,
        });
      } else {
        // No share sheet — save it instead so the image is at least reachable.
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.granted) {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Saved', 'The card is in your photos.');
        } else {
          throw new Error('No sharing and no photo permission');
        }
      }
    } catch (e) {
      console.error('Image share failed:', e);
      await Share.share({
        message: `A message in a bottle for ${message.recipient}: ${shareUrl}`,
        url: shareUrl,
      }).catch(() => {});
    } finally {
      setSharing(false);
    }
  }, [message, shareUrl]);

  const report = useCallback(() => {
    // The Terms promise a reporting route on every message; this is it.
    Alert.alert(
      'Report this message',
      'This goes straight to the person who runs the site. If the message is about you, it can be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await addFeedback(
                `[REPORT] Reported from mobile\nMessage: ${shareUrl}`,
                'report',
                user.uid
              );
              Alert.alert('Report sent', 'Thank you — it will be reviewed.');
            } catch {
              Alert.alert(
                "Couldn't send",
                `Please email ${siteConfig.contactEmail} with the link instead.`
              );
            }
          },
        },
      ]
    );
  }, [shareUrl, user]);

  if (isLoading || message === undefined) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
          padding: spacing[5],
          paddingTop: insets.top + spacing[6],
        }}
      >
        <Card>
          <Skeleton style={{ height: 16, width: '40%' }} />
          <Skeleton style={{ height: 14, width: '100%', marginTop: spacing[4] }} />
          <Skeleton style={{ height: 14, width: '90%', marginTop: spacing[2] }} />
        </Card>
      </View>
    );
  }

  if (!message) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundGrouped,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[5],
        }}
      >
        <AppText variant="h2">{loadError ? "Can't load that" : 'Nothing here'}</AppText>
        <AppText variant="muted" style={{ marginTop: spacing[2], textAlign: 'center' }}>
          {loadError ?? 'This bottle may have drifted away, or the link is wrong.'}
        </AppText>
        <Button
          title="Back to browse"
          onPress={() => router.replace('/browse')}
          style={{ marginTop: spacing[6] }}
        />
      </View>
    );
  }

  const openDate = message.openTimestamp
    ? new Date(message.openTimestamp.seconds * 1000)
    : null;
  const isLocked = !!openDate && openDate > new Date();
  const timestampLabel = message.timestamp
    ? format(message.timestamp, "MMMM d, yyyy 'at' h:mm a")
    : 'a few moments ago';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingTop: insets.top + spacing[2],
        paddingBottom: spacing[16],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[4],
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
          <AppText variant="muted" style={{ textTransform: 'capitalize' }}>
            {message.recipient}
          </AppText>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          {!isLocked && (
            <Pressable
              onPress={shareAsImage}
              disabled={sharing}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Share this message"
              accessibilityState={{ busy: sharing }}
            >
              <Share2
                size={20}
                color={sharing ? colors.mutedForeground : colors.foreground}
              />
            </Pressable>
          )}
          <Pressable
            onPress={report}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Report this message"
          >
            <Flag size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <Card>
        {isLocked && openDate ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
            <Lock size={40} color={colors.mutedForeground} />
            <AppText variant="muted" style={{ marginTop: spacing[4] }}>
              Opens on{' '}
              <AppText variant="body">{format(openDate, 'MMMM d, yyyy')}</AppText>
            </AppText>
            <Countdown unlockDate={openDate} />
          </View>
        ) : (
          <>
            <AppText variant="body" style={{ textTransform: 'capitalize' }}>
              For{' '}
              <AppText variant="quote" style={{ fontSize: 18 }}>
                {message.recipient}
              </AppText>
              ,
            </AppText>

            <View
              style={{
                borderLeftWidth: 2,
                borderLeftColor: colors.border,
                paddingLeft: spacing[4],
                marginTop: spacing[4],
              }}
            >
              <AppText variant="quote">{message.content}</AppText>
            </View>

            {!!message.photo && (
              <Image
                source={{ uri: message.photo }}
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: radius.container,
                  marginTop: spacing[5],
                }}
                resizeMode="cover"
                accessibilityLabel="Photo attached to this message"
              />
            )}

            {!!message.spotifyTrackId && (
              <View style={{ marginTop: spacing[5] }}>
                {/* Still click-to-load here, and deliberately not autoplaying.
                    This page is what a shared link opens — it can be tapped in
                    a group chat by someone who has no idea a song is attached,
                    and sound starting on its own is a different thing there
                    than it is in the reader you chose to open. */}
                <SongPlayer
                  trackId={message.spotifyTrackId}
                  requireTap={!playSpotify}
                  onRequestLoad={() => setPlaySpotify(true)}
                />
              </View>
            )}

            <AppText
              variant="small"
              style={{ textAlign: 'right', marginTop: spacing[5] }}
            >
              {timestampLabel}
            </AppText>
          </>
        )}
      </Card>

      {/* Below the card, clear of the back and share controls at the top. */}
      {!isLocked && <AdBanner unitId={AD_UNITS.messageBelow} />}

      {/* Off-screen render target for the shareable image.
          Positioned far off-canvas rather than hidden: view-shot needs a real,
          laid-out native view, and a display:none equivalent has no geometry
          to capture. Never rendered for a sealed message — there would be
          nothing to put on the card. */}
      {!isLocked && (
        <View
          style={{ position: 'absolute', left: -9999, top: 0 }}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ShareCard
            ref={shareCardRef}
            recipient={message.recipient}
            message={message.content}
          />
        </View>
      )}
    </ScrollView>
  );
}
