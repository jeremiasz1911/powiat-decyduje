import { FirebaseError } from 'firebase/app';
import { signInAnonymously, type User } from 'firebase/auth';

import { auth } from '@/src/lib/firebase';

export async function ensureAnonymousAuth(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const credentials = await signInAnonymously(auth);
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
