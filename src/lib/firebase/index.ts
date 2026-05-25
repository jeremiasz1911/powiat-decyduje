import { env } from '@/src/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
// eslint-disable-next-line import/no-unresolved
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

type Auth = FirebaseAuth.Auth;

const firebaseConfig = {
  apiKey: env?.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env?.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: env?.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId: env?.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

export const isFirebaseConfigured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));

if (!isFirebaseConfigured) {
  console.warn(
    'Firebase is not fully configured. Fill EXPO_PUBLIC_FIREBASE_* values in .env to enable Auth/Firestore/Storage.'
  );
}

export const app: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

let authInstance: Auth | null = null;

if (app) {
  if (Platform.OS === 'web') {
    authInstance = FirebaseAuth.getAuth(app);
  } else {
      try {
        authInstance = FirebaseAuth.initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (error) {
        if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
          authInstance = FirebaseAuth.getAuth(app);
        } else {
          throw error;
        }
      }
  }
}

if (app && !authInstance) {
  authInstance = FirebaseAuth.getAuth(app);
}

export const auth = authInstance;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;
export const functions: Functions | null = app ? getFunctions(app) : null;

const maskAppId = (value: string | undefined | null) => {
  if (!value) return null;
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
};

export const getFirebaseDiagnostics = () => ({
  configured: isFirebaseConfigured,
  sdk: 'firebase-js',
  projectId: env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? app?.options?.projectId ?? null,
  appId: maskAppId(env?.EXPO_PUBLIC_FIREBASE_APP_ID ?? app?.options?.appId ?? null),
  hasApiKey: Boolean(env?.EXPO_PUBLIC_FIREBASE_API_KEY),
  hasAuthDomain: Boolean(env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  hasStorageBucket: Boolean(env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  hasMessagingSenderId: Boolean(env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  hasDatabaseUrl: Boolean(env?.EXPO_PUBLIC_FIREBASE_DATABASE_URL),
  hasMeasurementId: Boolean(env?.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID),
  authReady: Boolean(auth),
  firestoreReady: Boolean(db),
  functionsReady: Boolean(functions),
  storageReady: Boolean(storage),
});
