'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This is a client-first module. Server-side admin functionality will not be initialized here.
// The data.ts file will handle its own server-side admin initialization.

let clientApp: FirebaseApp;

function getClientServices() {
  if (!getApps().length) {
    try {
      clientApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase client initialization failed:', e);
      clientApp = getApp(); // Fallback
    }
  } else {
    clientApp = getApp();
  }
  return {
    firebaseApp: clientApp,
    auth: getAuth(clientApp),
    firestore: getFirestore(clientApp),
  };
}

export function initializeFirebase() {
  // This function is now only for the client.
  return getClientServices();
}

// Barrel file exports for client-side components
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';