import { FirebaseError, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { env } from '@/src/config/env';

type Auth = FirebaseAuth.Auth;

const firebaseConfig = {
  apiKey: env?.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env?.EXPO_PUBLIC_FIREBASE_APP_ID,
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
      const maybeGetReactNativePersistence = (
        FirebaseAuth as unknown as {
          getReactNativePersistence?: (
            storage: typeof AsyncStorage
          ) => FirebaseAuth.Persistence | FirebaseAuth.Persistence[];
        }
      ).getReactNativePersistence;

      if (!maybeGetReactNativePersistence) {
        authInstance = FirebaseAuth.getAuth(app);
      } else {
        authInstance = FirebaseAuth.initializeAuth(app, {
          persistence: maybeGetReactNativePersistence(AsyncStorage),
        });
      }
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
