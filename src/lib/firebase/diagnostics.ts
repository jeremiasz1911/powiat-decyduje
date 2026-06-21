import { envFlags } from '@/src/config/env';

import { auth } from './auth';
import { app } from './app';
import { db } from './firestore';
import { functions } from './functions';
import { storage } from './storage';

export function getFirebaseDiagnostics() {
  return {
    sdk: 'firebase-js',
    configured: envFlags.firebaseProjectId && envFlags.firebaseAppId,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? null,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? null,
    authReady: Boolean(auth),
    firestoreReady: Boolean(db),
    functionsReady: Boolean(functions),
    storageReady: Boolean(storage && app.options.storageBucket),
  };
}
