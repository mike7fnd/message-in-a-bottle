import 'server-only';

import {
  getApps,
  initializeApp,
  cert,
  type App,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK — server only.
 *
 * This exists because entitlements must be written by something the user
 * cannot impersonate. The client SDK runs as the signed-in user, and the
 * `users/{uid}` rule allows a user to write their own document, so anything
 * stored through the client could be self-granted from the browser console.
 * The Admin SDK bypasses security rules, so `subscribers/{uid}` can be locked
 * to read-only for clients and written here alone.
 *
 * Credentials come from FIREBASE_SERVICE_ACCOUNT, the full service-account
 * JSON as a single-line string. Never prefix it NEXT_PUBLIC_.
 */

let cachedApp: App | undefined;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is not set. Billing routes cannot verify users or write entitlements without it.'
    );
  }

  let parsed: { project_id: string; client_email: string; private_key: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole service-account file as one line.'
    );
  }

  cachedApp = initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      // Vercel's environment UI stores newlines escaped.
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    }),
  });

  return cachedApp;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

/** True when the server has everything it needs to run billing. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

export interface VerifiedCaller {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
}

/**
 * Verifies the Firebase ID token on an incoming request.
 *
 * Returns null rather than throwing, so routes can decide the status code.
 * The anonymous check matters: every visitor is signed in anonymously, so
 * "has a token" is not the same as "has an account", and a subscription must
 * attach to an account the person can sign back into.
 */
export async function verifyCaller(
  request: Request
): Promise<VerifiedCaller | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
    };
  } catch {
    return null;
  }
}
