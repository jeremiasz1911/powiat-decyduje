import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: z.string().optional(),
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  EXPO_PUBLIC_BUILD_PROFILE: z.string().optional(),
  EXPO_PUBLIC_ENABLE_DIAGNOSTICS: z.string().optional(),
  EXPO_PUBLIC_DEV_SMS_BYPASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('Missing required EXPO_PUBLIC_FIREBASE_* environment variables.');
}

export const env = parsed.success ? parsed.data : null;
export const isDevSmsBypassEnabled = parsed.success && parsed.data.EXPO_PUBLIC_DEV_SMS_BYPASS === 'true';

export const envFlags = {
  firebaseApiKey: Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  firebaseAuthDomain: Boolean(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  firebaseProjectId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  firebaseStorageBucket: Boolean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  firebaseMessagingSenderId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  firebaseAppId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  firebaseDatabaseUrl: Boolean(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL),
  firebaseMeasurementId: Boolean(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID),
  googleMapsApiKey: Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY),
  diagnosticsEnabled: process.env.EXPO_PUBLIC_ENABLE_DIAGNOSTICS === 'true',
  buildProfile: process.env.EXPO_PUBLIC_BUILD_PROFILE ?? null,
};
