import { signInAnonymously, type User } from 'firebase/auth';

import { auth } from '@/src/lib/firebase';

export async function ensureAnonymousAuth(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credentials = await signInAnonymously(auth);
  return credentials.user;
}
