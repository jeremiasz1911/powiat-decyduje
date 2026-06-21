import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FUNCTIONS_EMULATOR_PORT = 5001;
const FIRESTORE_EMULATOR_PORT = 8080;

export function shouldUseFirebaseEmulators(): boolean {
  return process.env.EXPO_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true';
}

export function getFirebaseEmulatorHost(): string {
  const configuredHost = process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST?.trim();
  if (configuredHost) {
    return configuredHost;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const hostFromExpo = hostUri?.split(':')[0];
  return hostFromExpo ?? 'localhost';
}

export const firebaseEmulatorPorts = {
  functions: FUNCTIONS_EMULATOR_PORT,
  firestore: FIRESTORE_EMULATOR_PORT,
} as const;
