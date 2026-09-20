import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft, Heart, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Card, Skeleton, Textarea } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { getCachedReviews } from '../src/lib/cached-data';
import { addReview, type Review } from '../src/lib/data';
import { siteConfig } from '../src/lib/site-config';
import { useTheme } from '../src/theme/ThemeProvider';
import { spacing } from '../src/theme/tokens';

/** Read-only star row, or an interactive picker when onRate is supplied. */
function Stars({
  rating,
  size = 16,
  onRate,
}: {
  rating: number;
  size?: number;
  onRate?: (value: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        const star = (
          <Star
            size={size}
            color={filled ? '#F59E0B' : colors.mutedForeground}
            fill={filled ? '#F59E0B' : 'transparent'}
          />
        );
        if (!onRate) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            onPress={() => onRate(n)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityState={{ selected: n === Math.round(rating) }}
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * About — what the app is, who runs it, community reviews, and support.
 *
 * Native rather than a link to the web page, because reviews and the review
 * form are real app features. The legal documents stay on the web (see
 * Settings) so their text cannot drift between platforms.
 */
export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isAnonymous } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCachedReviews((fresh) => {
      if (!cancelled) setReviews(fresh);
    })
      .then((r) => {
        if (!cancelled) setReviews(r);
      })
      .catch(() => {
        /* offline — the section simply stays empty */
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const average =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  const submitReview = useCallback(async () => {
    if (rating < 1) {
      Alert.alert('Pick a rating', 'Choose between one and five stars.');
      return;
    }
    if (reviewText.trim().length < 3) {
      Alert.alert('Add a few words', 'Tell people what you thought.');
      return;
    }
    // Reviews are public and attributed, so they need a real account — an
    // anonymous uid would show up as a nameless entry nobody can follow up on.
    if (!user || isAnonymous) {
      Alert.alert(
        'Sign in to review',
        'Reviews show a name, so they need an account.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/auth') },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const name = user.displayName?.trim() || 'Anonymous';
      await addReview(rating, reviewText.trim(), user.uid, name);
      // Show it immediately rather than waiting for a refetch.
      setReviews((prev) => [
        {
          id: `local-${Date.now()}`,
          rating,
          content: reviewText.trim(),
          senderId: user.uid,
          senderName: name,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setRating(0);
      setReviewText('');
      Alert.alert('Thank you', 'Your review is live.');
    } catch (e) {
      console.error('Review failed:', e);
      Alert.alert("Couldn't post that", 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }, [rating, reviewText, user, isAnonymous, router]);

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
          About
        </AppText>

        <View style={{ marginTop: spacing[4], gap: spacing[3] }}>
          <AppText variant="muted">
            Message in a Bottle is a place to write something you can&apos;t
            quite say out loud, address it to a name, and let go of it. Your
            note drifts into a public ocean of letters, and you get a link you
            can pass on — or leave to be found.
          </AppText>
          <AppText variant="muted">
            Every message is public. Naming a recipient doesn&apos;t send them
            anything and doesn&apos;t keep anyone else out; it just files the
            note under that name. There is no inbox and no notification.
          </AppText>
          <AppText variant="muted">
            It&apos;s built and maintained by {siteConfig.operator}, an
            independent developer in the Philippines. One person, no team, no
            investors. Free to use, paid for by ads and the occasional donation.
          </AppText>
        </View>

        {/* Support */}
        <Card style={{ marginTop: spacing[6], alignItems: 'center' }}>
          <Heart size={28} color={colors.primary} />
          <AppText variant="h3" style={{ marginTop: spacing[3] }}>
            Support the project
          </AppText>
          <AppText
            variant="muted"
            style={{ textAlign: 'center', marginTop: spacing[2] }}
          >
            Contributions cover hosting and keep the app free for everyone.
          </AppText>
          <Button
            title="Donate via PayPal"
            onPress={() => Linking.openURL(siteConfig.donateUrl)}
            fullWidth
            style={{ marginTop: spacing[4] }}
          />
        </Card>

        {/* Reviews */}
        <AppText variant="h2" style={{ marginTop: spacing[8] }}>
          Community reviews
        </AppText>
        {loadingReviews ? (
          <View style={{ marginTop: spacing[4], gap: spacing[3] }}>
            {[0, 1].map((i) => (
              <Card key={i}>
                <Skeleton style={{ height: 14, width: '40%' }} />
                <Skeleton
                  style={{ height: 14, width: '100%', marginTop: spacing[3] }}
                />
              </Card>
            ))}
          </View>
        ) : reviews.length > 0 ? (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[2],
                marginTop: spacing[2],
              }}
            >
              <Stars rating={average} />
              <AppText variant="muted">
                {average.toFixed(1)} from {reviews.length} review
                {reviews.length === 1 ? '' : 's'}
              </AppText>
            </View>
            <View style={{ marginTop: spacing[4], gap: spacing[3] }}>
              {reviews.slice(0, 10).map((r) => (
                <Card key={r.id}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <AppText variant="h3">{r.senderName}</AppText>
                    <Stars rating={r.rating} size={14} />
                  </View>
                  {r.timestamp && (
                    <AppText variant="small" style={{ marginTop: spacing[1] }}>
                      {format(r.timestamp, 'MMMM d, yyyy')}
                    </AppText>
                  )}
                  <AppText variant="body" style={{ marginTop: spacing[3] }}>
                    {r.content}
                  </AppText>
                </Card>
              ))}
            </View>
          </>
        ) : (
          <AppText variant="muted" style={{ marginTop: spacing[3] }}>
            No reviews yet. Be the first.
          </AppText>
        )}

        {/* Leave a review */}
        <Card style={{ marginTop: spacing[6] }}>
          <AppText variant="h3">Rate the app</AppText>
          <View style={{ marginTop: spacing[3] }}>
            <Stars rating={rating} size={28} onRate={setRating} />
          </View>
          <Textarea
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="What did you like, or what would you change?"
            editable={!submitting}
            style={{ marginTop: spacing[4], minHeight: 100 }}
            accessibilityLabel="Your review"
          />
          <Button
            title="Submit review"
            onPress={submitReview}
            loading={submitting}
            fullWidth
            style={{ marginTop: spacing[4] }}
          />
        </Card>

        <Button
          title="Get in touch"
          variant="outline"
          onPress={() => router.push('/contact')}
          fullWidth
          style={{ marginTop: spacing[5] }}
        />
        <Button
          title="Open the website"
          variant="ghost"
          onPress={() => WebBrowser.openBrowserAsync(siteConfig.apiBaseUrl)}
          fullWidth
          style={{ marginTop: spacing[2] }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
