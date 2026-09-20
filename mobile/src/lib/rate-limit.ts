import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Send cooldown, ported from the web's src/lib/rate-limit.ts.
 *
 * Same honest caveat as the web version: this lives on the device, so
 * reinstalling the app or clearing its data resets it. It exists to stop
 * accidental double-sends and casual flooding, not determined abuse — real
 * enforcement would need a server-side check or Firebase App Check.
 */
const STORAGE_KEY = 'miab_last_sent';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // one message per day, as on the web

export interface RateLimitResult {
  allowed: boolean;
  /** Human-readable wait, e.g. "3 hours". Undefined when allowed. */
  retryAfterLabel?: string;
}

function formatWait(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export async function checkRateLimit(): Promise<RateLimitResult> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { allowed: true };
    const last = Number(raw);
    if (!Number.isFinite(last)) return { allowed: true };

    const elapsed = Date.now() - last;
    if (elapsed >= COOLDOWN_MS) return { allowed: true };

    return {
      allowed: false,
      retryAfterLabel: formatWait(COOLDOWN_MS - elapsed),
    };
  } catch {
    // Storage unavailable — fail open. Blocking sends because of a storage
    // error would break the app's only write path.
    return { allowed: true };
  }
}

export async function recordMessageSent(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* best effort */
  }
}
