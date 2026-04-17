import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInAnonymously, type Auth, type User } from 'firebase/auth';

import { auth } from '@/src/lib/firebase';

function requireAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  return auth;
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

export async function register(email: string, password: string): Promise<User> {
  const authInstance = requireAuth();
  const credentials = await createUserWithEmailAndPassword(authInstance, email, password);
  return credentials.user;
}
