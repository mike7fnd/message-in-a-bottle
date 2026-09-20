/**
 * Turns a Firestore failure into something a person can act on.
 *
 * The motivating case: when a project exhausts its daily read quota, every
 * query fails with `resource-exhausted`. Screens that only had an "empty" state
 * then said "No messages yet", which is actively misleading — it reads as *the
 * data does not exist* rather than *we could not fetch it*, and sends you
 * looking for a bug in the wrong place.
 */
export type LoadErrorKind =
  | 'quota'
  | 'offline'
  | 'permission'
  | 'unconfigured'
  | 'unknown';

export interface LoadError {
  kind: LoadErrorKind;
  /** Shown to the user. */
  message: string;
}

function codeOf(err: unknown): string {
  if (typeof err === 'object' && err && 'code' in err) {
    return String((err as { code: unknown }).code);
  }
  return '';
}

export function describeLoadError(err: unknown): LoadError {
  const code = codeOf(err);
  const text = err instanceof Error ? err.message : String(err ?? '');

  if (code.includes('resource-exhausted') || text.includes('Quota exceeded')) {
    return {
      kind: 'quota',
      message:
        "The app has hit today's database limit, so nothing new can load right now. It resets at midnight Pacific time.",
    };
  }

  if (code.includes('unavailable') || text.includes('Network')) {
    return {
      kind: 'offline',
      message:
        'No connection to the server. Anything you have already viewed still works offline.',
    };
  }

  if (code.includes('permission-denied')) {
    return {
      kind: 'permission',
      message: 'This content is not available to read right now.',
    };
  }

  if (text.includes('Firebase is not configured')) {
    return {
      kind: 'unconfigured',
      message:
        'The app is missing its Firebase settings. Copy .env.example to .env and fill in the EXPO_PUBLIC_FIREBASE_* values.',
    };
  }

  return {
    kind: 'unknown',
    message: 'Could not load that. Pull down to try again.',
  };
}
