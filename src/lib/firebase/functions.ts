import { connectFunctionsEmulator, getFunctions, httpsCallable, type HttpsCallable } from 'firebase/functions';

import { app } from './app';
import { firebaseEmulatorPorts, getFirebaseEmulatorHost, shouldUseFirebaseEmulators } from './emulator';

export const functions = getFunctions(app, 'us-central1');

let emulatorsConnected = false;

if (shouldUseFirebaseEmulators() && !emulatorsConnected) {
  connectFunctionsEmulator(functions, getFirebaseEmulatorHost(), firebaseEmulatorPorts.functions);
  emulatorsConnected = true;

  if (__DEV__) {
    console.info(
      `[Firebase] Using Functions emulator at ${getFirebaseEmulatorHost()}:${firebaseEmulatorPorts.functions}`
    );
  }
}

export function createCallable<TData = unknown, TResult = unknown>(
  name: string
): HttpsCallable<TData, TResult> {
  return httpsCallable<TData, TResult>(functions, name);
}
