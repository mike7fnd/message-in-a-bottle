import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { getAuthInstance } from '../lib/firebase';

/**
 * Auth, matching the web app's model exactly.
 *
 * Every visitor is signed in — anonymously if they have not made an account.
 * That anonymous uid is what satisfies the Firestore rule requiring a signed-in
 * caller to create a message, so it is the mechanism that lets "anonymous"
 * posting work without letting anyone forge a senderId. If it fails, sending
 * fails, so the error is surfaced rather than swallowed.
 */
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAnonymous: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let auth: Auth;
    try {
      auth = getAuthInstance();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Firebase is not configured.');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (next) => {
      if (next) {
        setUser(next);
        setIsLoading(false);
        return;
      }
      // No session — establish the anonymous one the rules expect.
      signInAnonymously(auth).catch((e) => {
        console.error('Anonymous sign-in failed:', e);
        setError(
          'Could not start a session. Check your connection and try again.'
        );
        setIsLoading(false);
      });
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isAnonymous: user?.isAnonymous ?? true,
      async signIn(email, password) {
        await signInWithEmailAndPassword(getAuthInstance(), email, password);
      },
      async signUp(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(
          getAuthInstance(),
          email,
          password
        );
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
      },
      async signOut() {
        // Signing out drops to a fresh anonymous session via the listener
        // above, rather than leaving the app with no credentials at all.
        await fbSignOut(getAuthInstance());
      },
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
