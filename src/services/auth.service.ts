import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInAnonymously, type Auth, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/src/lib/firebase';

function requireAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  return auth;
}

function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firebase Firestore is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  return db;
}

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type ResidentRegistrationAvailabilityPayload = {
  phoneNumber: string;
  pesel: string;
};

export type ResidentRegistrationAvailabilityResult = {
  phoneTaken: boolean;
  peselTaken: boolean;
};

function normalizePhoneNumber(rawPhoneNumber: string): string {
  const compact = rawPhoneNumber.replace(/[\s-]/g, '');

  if (/^\d{9}$/.test(compact)) {
    return `+48${compact}`;
  }

  if (/^48\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  return compact;
}

export async function ensureAnonymousAuth(): Promise<User> {
  const authInstance = requireAuth();

  if (authInstance.currentUser) {
    return authInstance.currentUser;
  }

  try {
    const credentials = await signInAnonymously(authInstance);
    return credentials.user;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/admin-restricted-operation') {
      throw new Error(
        'Firebase Anonymous Auth is disabled. Enable it in Firebase Console -> Authentication -> Sign-in method -> Anonymous.'
      );
    }

    throw error;
  }
}

export async function register(payload: RegisterPayload): Promise<User> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const credentials = await createUserWithEmailAndPassword(authInstance, payload.email, payload.password);

  await setDoc(doc(dbInstance, 'users', credentials.user.uid), {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    createdAt: serverTimestamp(),
  });

  return credentials.user;
}

export async function checkResidentRegistrationAvailability(
  payload: ResidentRegistrationAvailabilityPayload
): Promise<ResidentRegistrationAvailabilityResult> {
  const dbInstance = requireDb();
  const usersRef = collection(dbInstance, 'users');
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const normalizedPesel = payload.pesel.trim();

  const [phoneNumberSnapshot, legacyPhoneSnapshot, peselSnapshot] = await Promise.all([
    getDocs(query(usersRef, where('phoneNumber', '==', normalizedPhoneNumber), limit(1))),
    getDocs(query(usersRef, where('phone', '==', normalizedPhoneNumber), limit(1))),
    getDocs(query(usersRef, where('pesel', '==', normalizedPesel), limit(1))),
  ]);

  return {
    phoneTaken: !phoneNumberSnapshot.empty || !legacyPhoneSnapshot.empty,
    peselTaken: !peselSnapshot.empty,
  };
}
