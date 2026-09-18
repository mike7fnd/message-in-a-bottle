/**
 * Client-side rate limiting for message sending.
 *
 * Strategy:
 *  - Anonymous users  → localStorage key with last-sent timestamp
 *  - Signed-in users  → Firestore check (how many messages in the last 24h)
 *
 * localStorage is the enforcement layer for anonymous users.
 * It can be cleared, but it's the best available option without a backend.
 */

const LS_KEY = 'mitb_last_sent';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface RateLimitResult {
  allowed: boolean;
  /** How many ms until the cooldown expires (only set when allowed=false) */
  retryAfterMs?: number;
  /** Human-readable time remaining e.g. "23 hours 14 minutes" */
  retryAfterLabel?: string;
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'less than a minute';
}

/**
 * Check if the current device/user is allowed to send a message.
 * Call before submitting the form.
 */
export function checkRateLimit(): RateLimitResult {
  if (typeof window === 'undefined') return { allowed: true };

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { allowed: true };

    const lastSent = parseInt(raw, 10);
    if (isNaN(lastSent)) return { allowed: true };

    const elapsed = Date.now() - lastSent;
    if (elapsed >= COOLDOWN_MS) return { allowed: true };

    const retryAfterMs = COOLDOWN_MS - elapsed;
    return {
      allowed: false,
      retryAfterMs,
      retryAfterLabel: formatTimeRemaining(retryAfterMs),
    };
  } catch {
    return { allowed: true };
  }
}

/**
 * Record that a message was just sent. Call after successful submission.
 */
export function recordMessageSent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, Date.now().toString());
  } catch {
    // localStorage unavailable — fail silently
  }
}

/**
 * Clear the rate limit (for testing or admin use).
 */
export function clearRateLimit(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_KEY);
}

/**
 * Returns how long until the cooldown expires, or null if not rate limited.
 */
export function getTimeUntilNextMessage(): string | null {
  const result = checkRateLimit();
  if (result.allowed) return null;
  return result.retryAfterLabel ?? null;
}
