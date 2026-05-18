import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  EXPO_PUBLIC_DEV_SMS_BYPASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('Missing required EXPO_PUBLIC_FIREBASE_* environment variables.');
}

export const env = parsed.success ? parsed.data : null;
export const isDevSmsBypassEnabled = parsed.success && parsed.data.EXPO_PUBLIC_DEV_SMS_BYPASS === 'true';
