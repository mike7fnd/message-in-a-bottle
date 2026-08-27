/**
 * cached-data.ts
 *
 * Drop-in cached wrappers around the raw Firestore functions in data.ts.
 * All reads go through the smart cache. Mutations invalidate the right keys.
 *
 * Cache namespace map:
 *
 *   recipients          — browse recipient list (derived from messages)
 *   messages:list       — per-recipient message arrays   (key = recipient name)
 *   messages:single     — individual messages            (key = message id)
 *   messages:user       — messages sent by a user        (key = user uid)
 *   reviews             — community reviews              (key = 'all')
 *   content             — site-content.json              (key = 'site')
 *   spotify:featured    — featured tracks                (key = 'featured')
 *   spotify:search      — search results                 (key = query string)
 */

import {
  getMessagesForRecipient,
  getMessageById,
  getMessagesForUser,
  getRecipientsByFallback,
  getReviews,
  addMessage,
  deleteMessage,
  editMessage,
  type Message,
  type Recipient,
  type Review,
} from './data';
import { getContent, type SiteContent } from './content';
import { smartFetch, invalidateKey, invalidateNamespace, invalidateMany, TTL } from './cache';
import { memoryCache } from './cache/memory-cache';
import { persistentCache } from './cache/persistent-cache';

// ── Namespace constants ──────────────────────────────────────────────────────

export const NS = {
  RECIPIENTS: 'recipients',
  MSG_LIST: 'messages:list',
  MSG_SINGLE: 'messages:single',
  MSG_USER: 'messages:user',
  REVIEWS: 'reviews',
  CONTENT: 'content',
  SPOTIFY_FEATURED: 'spotify:featured',
  SPOTIFY_SEARCH: 'spotify:search',
} as const;

// ── Recipients ────────────────────────────────────────────────────────────────

export async function getCachedRecipients(
  searchTerm?: string,
  onFresh?: (data: Recipient[]) => void,
): Promise<Recipient[]> {
  const key = searchTerm ? `search:${searchTerm.toLowerCase().trim()}` : 'all';
  const { data } = await smartFetch<Recipient[]>({
    namespace: NS.RECIPIENTS,
    key,
    ttl: TTL.MEDIUM,
    persist: true,
    maxEntries: 30,
    fetcher: () => getRecipientsByFallback(searchTerm),
    onFresh,
  });
  return data;
}

// ── Messages by recipient ─────────────────────────────────────────────────────

export async function getCachedMessagesForRecipient(
  recipient: string,
  onFresh?: (data: Message[]) => void,
): Promise<Message[]> {
  const key = recipient.toLowerCase().trim();
  const { data } = await smartFetch<Message[]>({
    namespace: NS.MSG_LIST,
    key,
    ttl: TTL.MESSAGE_LIST,
    persist: true,
    maxEntries: 50,
    fetcher: () => getMessagesForRecipient(recipient),
    onFresh,
  });
  return data;
}

// ── Single message ────────────────────────────────────────────────────────────

export async function getCachedMessageById(
  id: string,
  onFresh?: (data: Message | undefined) => void,
): Promise<Message | undefined> {
  const { data } = await smartFetch<Message | undefined>({
    namespace: NS.MSG_SINGLE,
    key: id,
    ttl: TTL.MESSAGE,
    persist: false, // individual messages contain potentially sensitive content
    fetcher: () => getMessageById(id),
    onFresh,
  });
  return data;
}

// ── User's sent messages ──────────────────────────────────────────────────────

export async function getCachedMessagesForUser(
  userId: string,
  onFresh?: (data: Message[]) => void,
): Promise<Message[]> {
  const { data } = await smartFetch<Message[]>({
    namespace: NS.MSG_USER,
    key: userId,
    ttl: TTL.USER_MESSAGES,
    persist: false, // user-specific data — memory only
    fetcher: () => getMessagesForUser(userId),
    onFresh,
  });
  return data;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getCachedReviews(
  onFresh?: (data: Review[]) => void,
): Promise<Review[]> {
  const { data } = await smartFetch<Review[]>({
    namespace: NS.REVIEWS,
    key: 'all',
    ttl: TTL.SEMI_STATIC,
    persist: true,
    maxEntries: 5,
    fetcher: () => getReviews(),
    onFresh,
  });
  return data;
}

// ── Site content ──────────────────────────────────────────────────────────────

export async function getCachedContent(
  onFresh?: (data: SiteContent) => void,
): Promise<SiteContent> {
  const { data } = await smartFetch<SiteContent>({
    namespace: NS.CONTENT,
    key: 'site',
    ttl: TTL.STATIC,
    persist: true,
    maxEntries: 2,
    fetcher: () => getContent(),
    onFresh,
  });
  return data;
}

// ── Spotify (client-side fetch to our API routes) ────────────────────────────

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export async function getCachedFeaturedTracks(
  onFresh?: (tracks: SpotifyTrack[]) => void,
): Promise<SpotifyTrack[]> {
  const { data } = await smartFetch<SpotifyTrack[]>({
    namespace: NS.SPOTIFY_FEATURED,
    key: 'featured',
    ttl: TTL.SEMI_STATIC,
    persist: true,
    maxEntries: 2,
    fetcher: async () => {
      const res = await fetch('/api/spotify/featured');
      if (!res.ok) throw new Error('Failed to fetch featured tracks');
      const json = await res.json();
      return json.tracks as SpotifyTrack[];
    },
    onFresh,
  });
  return data;
}

export async function getCachedSpotifySearch(
  query: string,
  onFresh?: (tracks: SpotifyTrack[]) => void,
): Promise<SpotifyTrack[]> {
  const key = query.toLowerCase().trim();
  if (!key) return [];

  const { data } = await smartFetch<SpotifyTrack[]>({
    namespace: NS.SPOTIFY_SEARCH,
    key,
    ttl: TTL.SPOTIFY_SEARCH,
    persist: true,
    maxEntries: 100,
    fetcher: async () => {
      const res = await fetch(`/api/spotify/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Spotify search failed');
      const json = await res.json();
      return json.tracks as SpotifyTrack[];
    },
    onFresh,
  });
  return data;
}

// ── Mutation wrappers with cache invalidation ─────────────────────────────────

export async function addMessageCached(
  content: string,
  recipient: string,
  senderId?: string,
  photo?: string,
  spotifyTrackId?: string,
  openTimestamp?: Date,
): Promise<string> {
  const id = await addMessage(content, recipient, senderId, photo, spotifyTrackId, openTimestamp);

  // Invalidate affected caches
  const recipientKey = recipient.toLowerCase().trim();
  invalidateKey(NS.MSG_LIST, recipientKey);
  invalidateNamespace(NS.RECIPIENTS); // recipient counts changed

  // If user-specific cache exists, invalidate it
  if (senderId) invalidateKey(NS.MSG_USER, senderId);

  return id;
}

export async function deleteMessageCached(
  id: string,
  recipient: string,
  senderId?: string,
): Promise<void> {
  await deleteMessage(id);

  const recipientKey = recipient.toLowerCase().trim();
  invalidateKey(NS.MSG_LIST, recipientKey);
  invalidateKey(NS.MSG_SINGLE, id);
  invalidateNamespace(NS.RECIPIENTS);
  if (senderId) invalidateKey(NS.MSG_USER, senderId);
}

export async function editMessageCached(
  id: string,
  newContent: string,
  recipient?: string,
  senderId?: string,
): Promise<boolean> {
  const success = await editMessage(id, newContent);

  if (success) {
    // Remove the stale single-message cache so the next fetch is fresh
    invalidateKey(NS.MSG_SINGLE, id);

    // Also invalidate the containing list so the updated content appears
    if (recipient) invalidateKey(NS.MSG_LIST, recipient.toLowerCase().trim());
    if (senderId) invalidateKey(NS.MSG_USER, senderId);
  }

  return success;
}

/** Optimistically add a review to the reviews cache without waiting for a re-fetch */
export function optimisticAddReview(review: Review): void {
  const entry = memoryCache.get<Review[]>(NS.REVIEWS, 'all');
  if (entry) {
    const updated = [review, ...entry.data];
    const opts = { ttl: TTL.SEMI_STATIC, persist: true };
    memoryCache.set(NS.REVIEWS, 'all', updated, opts);
    persistentCache.set(NS.REVIEWS, 'all', updated, opts);
  }
}
