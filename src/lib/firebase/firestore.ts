import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import { app } from './app';
import { firebaseEmulatorPorts, getFirebaseEmulatorHost, shouldUseFirebaseEmulators } from './emulator';

export const db = getFirestore(app);

let firestoreEmulatorConnected = false;

if (shouldUseFirebaseEmulators() && !firestoreEmulatorConnected) {
  connectFirestoreEmulator(db, getFirebaseEmulatorHost(), firebaseEmulatorPorts.firestore);
  firestoreEmulatorConnected = true;

  if (__DEV__) {
    console.info(
      `[Firebase] Using Firestore emulator at ${getFirebaseEmulatorHost()}:${firebaseEmulatorPorts.firestore}`
    );
  }
}
