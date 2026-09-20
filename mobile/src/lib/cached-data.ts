import { smartFetch, invalidateKey, invalidateNamespace, TTL } from './cache';
import {
  addMessage,
  deleteMessage,
  editMessage,
  getMessageById,
  getMessagesForRecipient,
  getMessagesForUser,
  getRecipients,
  getReviews,
  type Message,
  type Recipient,
  type Review,
} from './data';
import { fetchSiteContent, type SiteContent } from './content';
import { siteConfig } from './site-config';

/**
 * Cached read paths and cache-invalidating write paths.
 *
 * Screens call these, never ./data directly — that is what keeps document
 * reads down and makes the app work offline. Mirrors the web app's
 * src/lib/cached-data.ts.
 */

export const NS = {
  RECIPIENTS: 'recipients',
  MSG_LIST: 'messages:list',
  MSG_SINGLE: 'messages:single',
  MSG_USER: 'messages:user',
  REVIEWS: 'reviews',
  CONTENT: 'content',
  SPOTIFY_SEARCH: 'spotify:search',
  SPOTIFY_FEATURED: 'spotify:featured',
} as const;

// ── Site content ─────────────────────────────────────────────────────────────

export function getCachedContent(
  onFresh?: (data: SiteContent) => void
): Promise<SiteContent> {
  return smartFetch({
    namespace: NS.CONTENT,
    key: 'site',
    ttl: TTL.STATIC,
    persist: true,
    fetcher: fetchSiteContent,
    onFresh,
  });
}

// ── Recipients (browse) ──────────────────────────────────────────────────────

export function getCachedRecipients(
  searchTerm?: string,
  onFresh?: (data: Recipient[]) => void,
  forceRefresh = false
): Promise<Recipient[]> {
  const key = searchTerm ? `search:${searchTerm.toLowerCase().trim()}` : 'all';
  return smartFetch({
    namespace: NS.RECIPIENTS,
    key,
    ttl: TTL.MEDIUM,
    persist: true,
    fetcher: () => getRecipients(searchTerm),
    onFresh,
    forceRefresh,
  });
}

// ── Messages ─────────────────────────────────────────────────────────────────

export function getCachedMessagesForRecipient(
  recipient: string,
  onFresh?: (data: Message[]) => void,
  forceRefresh = false
): Promise<Message[]> {
  return smartFetch({
    namespace: NS.MSG_LIST,
    key: recipient.toLowerCase().trim(),
    ttl: TTL.MESSAGE_LIST,
    persist: true,
    fetcher: () => getMessagesForRecipient(recipient),
    onFresh,
    forceRefresh,
  });
}

export function getCachedMessageById(
  id: string,
  onFresh?: (data: Message | undefined) => void
): Promise<Message | undefined> {
  return smartFetch({
    namespace: NS.MSG_SINGLE,
    key: id,
    ttl: TTL.MESSAGE,
    // Not persisted: an individual message is the most sensitive thing this
    // app holds, and it should not outlive the process on disk.
    persist: false,
    fetcher: () => getMessageById(id),
    onFresh,
  });
}

export function getCachedMessagesForUser(
  userId: string,
  onFresh?: (data: Message[]) => void,
  forceRefresh = false
): Promise<Message[]> {
  return smartFetch({
    namespace: NS.MSG_USER,
    key: userId,
    ttl: TTL.USER_MESSAGES,
    persist: false, // user-specific — memory only
    fetcher: () => getMessagesForUser(userId),
    onFresh,
    forceRefresh,
  });
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export function getCachedReviews(
  onFresh?: (data: Review[]) => void
): Promise<Review[]> {
  return smartFetch({
    namespace: NS.REVIEWS,
    key: 'all',
    ttl: TTL.SEMI_STATIC,
    persist: true,
    fetcher: () => getReviews(),
    onFresh,
  });
}

// ── Spotify, via the web app's API routes ────────────────────────────────────

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
}

export function getCachedFeaturedTracks(): Promise<SpotifyTrack[]> {
  return smartFetch({
    namespace: NS.SPOTIFY_FEATURED,
    key: 'featured',
    ttl: TTL.SEMI_STATIC,
    persist: true,
    fetcher: async () => {
      const res = await fetch(`${siteConfig.apiBaseUrl}/api/spotify/featured`);
      if (!res.ok) throw new Error('Failed to load featured tracks');
      return ((await res.json()).tracks ?? []) as SpotifyTrack[];
    },
  });
}

export function getCachedSpotifySearch(
  queryText: string
): Promise<SpotifyTrack[]> {
  const key = queryText.toLowerCase().trim();
  if (!key) return Promise.resolve([]);
  return smartFetch({
    namespace: NS.SPOTIFY_SEARCH,
    key,
    ttl: TTL.SPOTIFY_SEARCH,
    persist: true,
    fetcher: async () => {
      const res = await fetch(
        `${siteConfig.apiBaseUrl}/api/spotify/search?query=${encodeURIComponent(queryText)}`
      );
      if (!res.ok) throw new Error('Spotify search failed');
      return ((await res.json()).tracks ?? []) as SpotifyTrack[];
    },
  });
}

// ── Writes, with invalidation ────────────────────────────────────────────────

export async function addMessageCached(
  content: string,
  recipient: string,
  senderId?: string,
  photo?: string,
  spotifyTrackId?: string,
  openTimestamp?: Date
): Promise<string> {
  const id = await addMessage(
    content,
    recipient,
    senderId,
    photo,
    spotifyTrackId,
    openTimestamp
  );
  invalidateKey(NS.MSG_LIST, recipient.toLowerCase().trim());
  invalidateNamespace(NS.RECIPIENTS); // counts and ordering changed
  if (senderId) invalidateKey(NS.MSG_USER, senderId);
  return id;
}

export async function deleteMessageCached(
  id: string,
  recipient: string,
  senderId?: string
): Promise<void> {
  await deleteMessage(id);
  invalidateKey(NS.MSG_SINGLE, id);
  invalidateKey(NS.MSG_LIST, recipient.toLowerCase().trim());
  invalidateNamespace(NS.RECIPIENTS);
  if (senderId) invalidateKey(NS.MSG_USER, senderId);
}

export async function editMessageCached(
  id: string,
  newContent: string,
  recipient?: string,
  senderId?: string
): Promise<void> {
  await editMessage(id, newContent);
  invalidateKey(NS.MSG_SINGLE, id);
  if (recipient) invalidateKey(NS.MSG_LIST, recipient.toLowerCase().trim());
  if (senderId) invalidateKey(NS.MSG_USER, senderId);
}
