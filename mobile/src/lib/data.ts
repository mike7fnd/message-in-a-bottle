import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import 'react-native-get-random-values'; // must precede uuid
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './firebase';

/**
 * Firestore access, ported from the web app's src/lib/data.ts.
 *
 * Same collections, same document shapes, same security rules — this is the
 * identical backend, not a parallel one.
 *
 * Two deliberate differences from the web version, both fixing unbounded reads
 * that cost a document read per message with no ceiling:
 *   - getMessagesForRecipient and getMessagesForUser take a limit.
 *   - getReviews takes a limit.
 * Firebase bills per document read, and a phone on mobile data is exactly where
 * an unbounded fetch hurts most.
 */

export type Message = {
  id: string;
  content: string;
  recipient: string;
  timestamp: Date | null;
  senderId?: string;
  photo?: string;
  spotifyTrackId?: string;
  openTimestamp?: { seconds: number; nanoseconds: number } | null;
  /**
   * How many times this letter has been opened. Absent means unknown, NOT
   * zero: messages predating the counter have no value, and claiming 'nobody
   * has read this' without evidence would be a lie.
   */
  openCount?: number;
};

export type Recipient = {
  name: string;
  messageCount: number;
  lastMessageTimestamp: Timestamp | null;
};

export type Review = {
  id: string;
  rating: number;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date | null;
};

/** Default page sizes — tuned for a phone screen, not a desktop grid. */
export const PAGE_SIZE = {
  bottleMessages: 30,
  userMessages: 30,
  browseScan: 60,
  reviews: 20,
} as const;

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

function mapMessage(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    content: (data.content as string) ?? '',
    recipient: (data.recipient as string) ?? '',
    timestamp: toDate(data.timestamp),
    senderId: data.senderId as string | undefined,
    photo: data.photo as string | undefined,
    spotifyTrackId: data.spotifyTrackId as string | undefined,
    openTimestamp:
      (data.openTimestamp as Message['openTimestamp']) ?? null,
    openCount:
      typeof data.openCount === 'number' ? data.openCount : undefined,
  };
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function addMessage(
  content: string,
  recipient: string,
  senderId?: string,
  photo?: string,
  spotifyTrackId?: string,
  openTimestamp?: Date
): Promise<string> {
  const db = getDb();
  const messageId = uuidv4();
  const ref = doc(db, 'public_messages', messageId);

  // Firestore rejects undefined values outright, so optional fields are added
  // conditionally rather than spread in as undefined.
  const payload: Record<string, unknown> = {
    id: messageId,
    content,
    recipient: recipient.toLowerCase().trim(),
    timestamp: serverTimestamp(),
  };
  if (senderId) payload.senderId = senderId;
  if (photo) payload.photo = photo;
  if (spotifyTrackId) payload.spotifyTrackId = spotifyTrackId;
  if (openTimestamp) payload.openTimestamp = openTimestamp;
  // Starts the counter so this letter can legitimately say nobody has opened
  // it yet. Messages written before this existed have no field at all.
  payload.openCount = 0;

  await setDoc(ref, payload);
  return messageId;
}

export async function deleteMessage(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'public_messages', id));
}

export async function editMessage(
  id: string,
  newContent: string
): Promise<void> {
  // The security rules only permit `content` to change on update.
  await updateDoc(doc(getDb(), 'public_messages', id), { content: newContent });
}

export async function addFeedback(
  content: string,
  type: string,
  senderId: string
): Promise<string> {
  const ref = await addDoc(collection(getDb(), 'feedback'), {
    content,
    type,
    senderId,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function addReview(
  rating: number,
  content: string,
  senderId: string,
  senderName: string
): Promise<string> {
  const db = getDb();
  const reviewId = uuidv4();
  await setDoc(doc(db, 'reviews', reviewId), {
    id: reviewId,
    rating,
    content,
    senderId,
    senderName,
    timestamp: serverTimestamp(),
  });
  return reviewId;
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getMessagesForRecipient(
  recipient: string,
  max: number = PAGE_SIZE.bottleMessages
): Promise<Message[]> {
  const db = getDb();
  // No orderBy: combining it with the equality filter needs a composite index,
  // and the web app made the same trade. Sorting happens below.
  const snapshot = await getDocs(
    query(
      collection(db, 'public_messages'),
      where('recipient', '==', recipient.toLowerCase().trim()),
      limit(max)
    )
  );

  return snapshot.docs
    .map((d) => mapMessage(d.id, d.data()))
    .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
}

export async function getMessageById(id: string): Promise<Message | undefined> {
  const snapshot = await getDoc(doc(getDb(), 'public_messages', id));
  if (!snapshot.exists()) return undefined;
  return mapMessage(snapshot.id, snapshot.data());
}

export async function getMessagesForUser(
  userId: string,
  max: number = PAGE_SIZE.userMessages
): Promise<Message[]> {
  const snapshot = await getDocs(
    query(
      collection(getDb(), 'public_messages'),
      where('senderId', '==', userId),
      limit(max)
    )
  );

  return snapshot.docs
    .map((d) => mapMessage(d.id, d.data()))
    .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
}

/**
 * Browse list.
 *
 * Mirrors the web's `getRecipientsByFallback`: the `recipients` aggregate
 * collection exists in the schema but is never written, so the list is derived
 * by scanning recent messages and grouping them. Message counts are therefore
 * counts within the scanned window, not lifetime totals — the same caveat the
 * web app carries.
 */
export async function getRecipients(
  searchTerm?: string,
  max: number = PAGE_SIZE.browseScan
): Promise<Recipient[]> {
  const db = getDb();
  const term = searchTerm?.toLowerCase().trim();

  const q = term
    ? query(
        collection(db, 'public_messages'),
        where('recipient', '>=', term),
        where('recipient', '<=', term + ''),
        limit(max)
      )
    : query(
        collection(db, 'public_messages'),
        orderBy('timestamp', 'desc'),
        limit(max)
      );

  const snapshot = await getDocs(q);

  const grouped = new Map<string, { count: number; latest: Timestamp | null }>();
  snapshot.forEach((d) => {
    const data = d.data();
    const name = data.recipient as string;
    if (!name) return;
    const ts = data.timestamp instanceof Timestamp ? data.timestamp : null;
    const current = grouped.get(name);
    if (!current) {
      grouped.set(name, { count: 1, latest: ts });
      return;
    }
    current.count += 1;
    if (ts && (!current.latest || ts.toMillis() > current.latest.toMillis())) {
      current.latest = ts;
    }
  });

  return Array.from(grouped.entries())
    .map(([name, v]) => ({
      name,
      messageCount: v.count,
      lastMessageTimestamp: v.latest,
    }))
    .sort(
      (a, b) =>
        (b.lastMessageTimestamp?.toMillis() ?? 0) -
        (a.lastMessageTimestamp?.toMillis() ?? 0)
    );
}

export async function getReviews(
  max: number = PAGE_SIZE.reviews
): Promise<Review[]> {
  const snapshot = await getDocs(
    query(
      collection(getDb(), 'reviews'),
      orderBy('timestamp', 'desc'),
      limit(max)
    )
  );

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      rating: (data.rating as number) ?? 0,
      content: (data.content as string) ?? '',
      senderId: (data.senderId as string) ?? '',
      senderName: (data.senderName as string) ?? 'Anonymous',
      timestamp: toDate(data.timestamp),
    };
  });
}

// ── Feed ─────────────────────────────────────────────────────────────────────
//
// Currently unused: Home is the bottle grid, not a message feed. Kept because
// the cursor plumbing below is the hard part, and it is what any future
// chronological surface would be built on. Delete it if that is ruled out.

/**
 * Opaque cursor for feed pagination.
 *
 * It is the raw Firestore snapshot of the last document on the previous page,
 * which is what `startAfter` needs. Callers treat it as a token and never look
 * inside it.
 */
export type FeedCursor = QueryDocumentSnapshot<DocumentData> | null;

export interface FeedPage {
  messages: Message[];
  cursor: FeedCursor;
  /** False once a page comes back short, meaning there is nothing after it. */
  hasMore: boolean;
}

/** Messages per feed page. Small enough that scrolling stays cheap. */
export const FEED_PAGE_SIZE = 15;

/**
 * The main feed: newest messages first, cursor-paginated.
 *
 * Uses only `orderBy('timestamp')`, which Firestore serves from the automatic
 * single-field index — no composite index to create. That is deliberate: the
 * feed is the highest-traffic query in the app and should not depend on manual
 * console setup to work.
 */
export async function getFeedPage(
  cursor: FeedCursor = null,
  pageSize: number = FEED_PAGE_SIZE
): Promise<FeedPage> {
  const db = getDb();
  const base = [
    collection(db, 'public_messages'),
    orderBy('timestamp', 'desc'),
    limit(pageSize),
  ] as const;

  const q = cursor
    ? query(base[0], base[1], startAfter(cursor), base[2])
    : query(base[0], base[1], base[2]);

  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map((d) => mapMessage(d.id, d.data()));

  return {
    messages,
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

/**
 * A feed restricted to specific recipient names — used for both "Following"
 * and "For you".
 *
 * Firestore caps an `in` filter at 30 values, so the caller's list is trimmed;
 * names are ranked by the caller so the most relevant survive the cut.
 *
 * This combination (`where` + `orderBy` on different fields) DOES need a
 * composite index on `recipient ASC, timestamp DESC`. Firestore returns a
 * failed-precondition error containing a one-click creation link the first
 * time it runs — see mobile/README.md.
 */
export const FEED_NAME_LIMIT = 30;

export async function getFeedPageForNames(
  names: string[],
  cursor: FeedCursor = null,
  pageSize: number = FEED_PAGE_SIZE
): Promise<FeedPage> {
  const trimmed = names
    .map((n) => n.toLowerCase().trim())
    .filter(Boolean)
    .slice(0, FEED_NAME_LIMIT);

  if (trimmed.length === 0) {
    return { messages: [], cursor: null, hasMore: false };
  }

  const db = getDb();
  const ref = collection(db, 'public_messages');

  const q = cursor
    ? query(
        ref,
        where('recipient', 'in', trimmed),
        orderBy('timestamp', 'desc'),
        startAfter(cursor),
        limit(pageSize)
      )
    : query(
        ref,
        where('recipient', 'in', trimmed),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map((d) => mapMessage(d.id, d.data()));

  return {
    messages,
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

/**
 * Records that a letter has been opened.
 *
 * Deliberately fire-and-forget and never awaited by the UI: a failure here —
 * offline, over quota, rules changed — must never stop someone reading. The
 * caller guards against repeats from the same device, so this is one write per
 * device per letter, not one per view.
 *
 * Uses an atomic increment so two readers opening at once cannot clobber each
 * other's count.
 */
export function markOpened(id: string): void {
  try {
    void updateDoc(doc(getDb(), 'public_messages', id), {
      openCount: increment(1),
    }).catch(() => {
      /* counters are cosmetic; losing one is not worth surfacing */
    });
  } catch {
    /* getDb() can throw when Firebase is unconfigured */
  }
}
