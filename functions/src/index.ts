import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// SMS rate limit constants
const SMS_RATE_LIMIT = {
  SMS_MAX_PER_5_MIN: 3,
  SMS_MAX_PER_DAY: 10,
  SMS_BLOCK_DURATION_MS: 3600000, // 1 hour
  SMS_CODE_EXPIRY_MS: 600000, // 10 minutes
  SMS_MAX_VERIFY_ATTEMPTS: 5,
  SMS_VERIFY_ATTEMPT_BLOCK_MS: 900000, // 15 minutes
};

// Dev bypass phone number
const DEV_PHONE = '+48500400300';

interface SmsRateLimitStatus {
  allowed: boolean;
  blockedUntil?: number;
  smsCountIn5Min?: number;
  smsCountToday?: number;
}

interface ResidentPhoneVerificationResult {
  verificationId: string;
  normalizedPhoneNumber: string;
  expiresAt: number;
}

interface ResidentPhoneLoginResult {
  success: boolean;
  phoneNumber: string;
  uid?: string;
  customToken?: string;
}

/**
 * Create resident phone verification code on backend
 * Called from native app to handle SMS verification on devices without recaptcha
 */
export const createResidentPhoneVerificationCode = functions.https.onCall(
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication is required before requesting an SMS code.'
      );
    }

    const data = (request.data ?? {}) as { phoneNumber?: string };
    const phoneNumber = data.phoneNumber as string;

    if (!phoneNumber) {
      throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
    }

    try {
      // Normalize phone number
      const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
      if (normalizedPhoneNumber.length < 9) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid phone number format');
      }

      // Check rate limits (bypass for dev phone)
      if (normalizedPhoneNumber !== DEV_PHONE.replace(/\D/g, '')) {
        const rateLimitStatus = await checkSmsRateLimit(normalizedPhoneNumber);
        if (!rateLimitStatus.allowed) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `SMS rate limit exceeded. Blocked until ${new Date(rateLimitStatus.blockedUntil!).toISOString()}`
          );
        }
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + SMS_RATE_LIMIT.SMS_CODE_EXPIRY_MS;

      // Store verification code in Firestore
      const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.collection('sms_verifications').doc(verificationId).set(
        {
          phoneNumber: normalizedPhoneNumber,
          code,
          expiresAt,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          attempts: 0,
          blockedUntil: null,
          status: 'pending',
        },
        { merge: true }
      );

      // Record SMS send attempt in rate limit tracker
      await recordSmsSend(normalizedPhoneNumber);

      // Send SMS via Firebase (requires Twilio or similar integration)
      // For now, log the code
      console.log(`SMS Code for ${normalizedPhoneNumber}: ${code}`);

      return {
        verificationId,
        normalizedPhoneNumber,
        expiresAt,
      } as ResidentPhoneVerificationResult;
    } catch (error) {
      console.error('Error creating phone verification code:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create verification code'
      );
    }
  }
);

/**
 * Verify SMS code and create authentication token
 */
export const verifyResidentPhoneCode = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication is required before verifying an SMS code.'
    );
  }

  const data = (request.data ?? {}) as { verificationId?: string; code?: string };
  const { verificationId, code } = data;

  if (!verificationId || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'verificationId and code are required');
  }

  try {
    // Get verification record
    const verificationDoc = await db.collection('sms_verifications').doc(verificationId).get();

    if (!verificationDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Verification not found');
    }

    const verification = verificationDoc.data()!;

    // Check if code is expired
    if (Date.now() > verification.expiresAt) {
      throw new functions.https.HttpsError('invalid-argument', 'SMS code has expired');
    }

    // Check if blocked due to too many attempts
    if (verification.blockedUntil && Date.now() < verification.blockedUntil) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many failed attempts. Please try again later.'
      );
    }

    // Check code
    if (verification.code !== code) {
      // Increment attempts
      const newAttempts = (verification.attempts || 0) + 1;
      const shouldBlock = newAttempts >= SMS_RATE_LIMIT.SMS_MAX_VERIFY_ATTEMPTS;

      await db.collection('sms_verifications').doc(verificationId).update({
        attempts: newAttempts,
        blockedUntil: shouldBlock ? Date.now() + SMS_RATE_LIMIT.SMS_VERIFY_ATTEMPT_BLOCK_MS : null,
      });

      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid code. ${SMS_RATE_LIMIT.SMS_MAX_VERIFY_ATTEMPTS - newAttempts} attempts remaining.`
      );
    }

    // Code is valid - mark as verified
    await db.collection('sms_verifications').doc(verificationId).update({
      status: 'verified',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const phoneIndexDoc = await db.collection('auth_index_phone').doc(verification.phoneNumber).get();
    const phoneIndexData = phoneIndexDoc.data();
    const uid = typeof phoneIndexData?.uid === 'string' ? phoneIndexData.uid : undefined;
    const customToken = uid
      ? await auth.createCustomToken(uid, {
          phoneNumber: verification.phoneNumber,
        })
      : undefined;

    return {
      success: true,
      phoneNumber: verification.phoneNumber,
      uid,
      customToken,
    } as ResidentPhoneLoginResult;
  } catch (error) {
    console.error('Error verifying phone code:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify code');
  }
});

/**
 * Check SMS rate limit for a phone number
 */
async function checkSmsRateLimit(normalizedPhoneNumber: string): Promise<SmsRateLimitStatus> {
  try {
    const rateLimitRef = db.collection('sms_rate_limits').doc(normalizedPhoneNumber);
    const rateLimitDoc = await rateLimitRef.get();

    if (!rateLimitDoc.exists) {
      return { allowed: true };
    }

    const rateLimit = rateLimitDoc.data()!;
    const now = Date.now();

    // Check if blocked
    if (rateLimit.blockedUntil && now < rateLimit.blockedUntil) {
      return {
        allowed: false,
        blockedUntil: rateLimit.blockedUntil,
      };
    }

    // Check 5-minute limit
    const timeSince5Min = now - (rateLimit.lastSmsTime || 0);
    const smsCountIn5Min =
      timeSince5Min < 300000 ? (rateLimit.smsCount5Min || 0) : 0;

    if (smsCountIn5Min >= SMS_RATE_LIMIT.SMS_MAX_PER_5_MIN) {
      return {
        allowed: false,
        blockedUntil: (rateLimit.lastSmsTime || 0) + 300000,
        smsCountIn5Min,
      };
    }

    // Check daily limit
    const timeSinceDay = now - (rateLimit.dayResetTime || now);
    const smsCountToday =
      timeSinceDay < 86400000 ? (rateLimit.smsCountDay || 0) : 0;

    if (smsCountToday >= SMS_RATE_LIMIT.SMS_MAX_PER_DAY) {
      return {
        allowed: false,
        blockedUntil: (rateLimit.dayResetTime || now) + 86400000,
        smsCountToday,
      };
    }

    return {
      allowed: true,
      smsCountIn5Min,
      smsCountToday,
    };
  } catch (error) {
    console.error('Error checking SMS rate limit:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check rate limit');
  }
}

/**
 * Record SMS send attempt for rate limiting
 */
async function recordSmsSend(normalizedPhoneNumber: string): Promise<void> {
  try {
    const rateLimitRef = db.collection('sms_rate_limits').doc(normalizedPhoneNumber);
    const now = Date.now();

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      if (!doc.exists) {
        transaction.set(rateLimitRef, {
          smsCount5Min: 1,
          smsCountDay: 1,
          lastSmsTime: now,
          dayResetTime: now,
          blockedUntil: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const rateLimit = doc.data()!;
        const timeSince5Min = now - (rateLimit.lastSmsTime || 0);
        const timeSinceDay = now - (rateLimit.dayResetTime || now);

        transaction.update(rateLimitRef, {
          smsCount5Min: timeSince5Min < 300000 ? (rateLimit.smsCount5Min || 0) + 1 : 1,
          smsCountDay: timeSinceDay < 86400000 ? (rateLimit.smsCountDay || 0) + 1 : 1,
          lastSmsTime: now,
          dayResetTime: timeSinceDay >= 86400000 ? now : rateLimit.dayResetTime,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
  } catch (error) {
    console.error('Error recording SMS send:', error);
    throw error;
  }
}
