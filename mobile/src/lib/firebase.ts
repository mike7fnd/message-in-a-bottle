import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './site-config';

/**
 * Firebase singleton for React Native.
 *
 * The important difference from the web app: `getAuth()` on React Native
 * defaults to in-memory persistence, which silently signs the user out on every
 * cold start. `initializeAuth` with AsyncStorage persistence is what makes the
 * session — including the anonymous one every visitor gets — survive a restart.
 * It must be called exactly once, before any `getAuth()`.
 */

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function initializeFirebase(): FirebaseServices {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and fill in the ' +
        'EXPO_PUBLIC_FIREBASE_* values from your Firebase console.'
    );
  }

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  if (!auth) {
    try {
      // `getReactNativePersistence` is exported by the React Native build of
      // firebase/auth but is absent from the published type definitions — a
      // known upstream gap. Reading it off the namespace keeps the cast local
      // and, unlike @ts-expect-error, will not itself become an error if the
      // types are fixed in a later release.
      const getReactNativePersistence = (
        firebaseAuth as unknown as {
          getReactNativePersistence: (storage: unknown) => never;
        }
      ).getReactNativePersistence;

      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // initializeAuth throws if auth was already initialised for this app,
      // which happens across Fast Refresh cycles in development.
      auth = getAuth(app);
    }
  }

  if (!firestore) {
    firestore = getFirestore(app);
  }

  return { app, auth, firestore };
}

export function getDb(): Firestore {
  return initializeFirebase().firestore;
}

export function getAuthInstance(): Auth {
  return initializeFirebase().auth;
}
