import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

const SMS_RATE_LIMIT = {
  SMS_MAX_PER_5_MIN: 3,
  SMS_MAX_PER_DAY: 10,
  SMS_BLOCK_DURATION_MS: 3600000,
  SMS_CODE_EXPIRY_MS: 600000,
  SMS_MAX_VERIFY_ATTEMPTS: 5,
  SMS_VERIFY_ATTEMPT_BLOCK_MS: 900000,
};

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

function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.startsWith('48')) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+48${digits}`;
  }

  return `+${digits}`;
}

export const createResidentPhoneVerificationCode = functions.https.onCall(
  async (data: any, context: any) => {
    console.log('========== [SMS-CF] AUTH DEBUG ==========');
    console.log('[SMS-CF] context.auth exists:', !!context.auth);
    console.log('[SMS-CF] uid:', context.auth?.uid);
    console.log('[SMS-CF] token email:', context.auth?.token?.email);
    console.log('[SMS-CF] token firebase:', context.auth?.token?.firebase);
    console.log('[SMS-CF] authorization header exists:', !!context.rawRequest.headers.authorization);
    console.log('[SMS-CF] user-agent:', context.rawRequest.headers['user-agent']);
    console.log('=========================================');

    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication is required before requesting an SMS code.'
      );
    }

    const phoneNumber = data.phoneNumber as string;

    if (!phoneNumber) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Phone number is required'
      );
    }

    try {
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

      console.log('[SMS-CF] Phone normalized', {
        uid: context.auth.uid,
        normalizedPhoneNumber,
      });

      if (normalizedPhoneNumber !== DEV_PHONE) {
        const rateLimitStatus = await checkSmsRateLimit(normalizedPhoneNumber);

        if (!rateLimitStatus.allowed) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `SMS sending is temporarily blocked. Try again later.`
          );
        }
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + SMS_RATE_LIMIT.SMS_CODE_EXPIRY_MS;
      const verificationId = `verify_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;

      await db.collection('sms_verifications').doc(verificationId).set({
        uid: context.auth.uid,
        phoneNumber: normalizedPhoneNumber,
        code,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: 0,
        blockedUntil: null,
        status: 'pending',
      });

      await recordSmsSend(normalizedPhoneNumber);

      console.log('[SMS-CF] Verification code created', {
        verificationId,
        normalizedPhoneNumber,
        code,
        expiresAt,
      });

      return {
        verificationId,
        normalizedPhoneNumber,
        expiresAt,
      } as ResidentPhoneVerificationResult;
    } catch (error) {
      console.error('[SMS-CF] createResidentPhoneVerificationCode ERROR', {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof functions.https.HttpsError ? error.code : 'unknown',
      });

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

export const verifyResidentPhoneCode = functions.https.onCall(
  async (data: any, context: any) => {
    console.log('[SMS-CF] verifyResidentPhoneCode START', {
      uid: context.auth?.uid,
      hasAuth: !!context.auth,
      hasVerificationId: !!data.verificationId,
      hasCode: !!data.code,
    });

    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication is required before verifying an SMS code.'
      );
    }

    const { verificationId, code } = data;

    if (!verificationId || !code) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'verificationId and code are required'
      );
    }

    try {
      const verificationRef = db
        .collection('sms_verifications')
        .doc(verificationId);

      const verificationDoc = await verificationRef.get();

      if (!verificationDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Verification not found'
        );
      }

      const verification = verificationDoc.data()!;

      if (verification.uid !== context.auth.uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'This verification does not belong to the current user.'
        );
      }

      if (Date.now() > verification.expiresAt) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'SMS code has expired'
        );
      }

      if (verification.blockedUntil && Date.now() < verification.blockedUntil) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many failed attempts. Please try again later.'
        );
      }

      if (verification.code !== code) {
        const newAttempts = (verification.attempts || 0) + 1;
        const shouldBlock =
          newAttempts >= SMS_RATE_LIMIT.SMS_MAX_VERIFY_ATTEMPTS;

        await verificationRef.update({
          attempts: newAttempts,
          blockedUntil: shouldBlock
            ? Date.now() + SMS_RATE_LIMIT.SMS_VERIFY_ATTEMPT_BLOCK_MS
            : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid code. ${Math.max(
            SMS_RATE_LIMIT.SMS_MAX_VERIFY_ATTEMPTS - newAttempts,
            0
          )} attempts remaining.`
        );
      }

      await verificationRef.update({
        status: 'verified',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const phoneIndexDoc = await db
        .collection('auth_index_phone')
        .doc(verification.phoneNumber)
        .get();

      const phoneIndexData = phoneIndexDoc.data();
      const uid =
        typeof phoneIndexData?.uid === 'string'
          ? phoneIndexData.uid
          : undefined;

      const customToken = uid
        ? await auth.createCustomToken(uid, {
            phoneNumber: verification.phoneNumber,
          })
        : undefined;

      console.log('[SMS-CF] verifyResidentPhoneCode SUCCESS', {
        uid: !!uid,
        customToken: !!customToken,
      });

      return {
        success: true,
        phoneNumber: verification.phoneNumber,
        uid,
        customToken,
      } as ResidentPhoneLoginResult;
    } catch (error) {
      console.error('[SMS-CF] verifyResidentPhoneCode ERROR', {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof functions.https.HttpsError ? error.code : 'unknown',
      });

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to verify code'
      );
    }
  }
);

async function checkSmsRateLimit(
  normalizedPhoneNumber: string
): Promise<SmsRateLimitStatus> {
  const rateLimitRef = db
    .collection('sms_rate_limits')
    .doc(normalizedPhoneNumber);

  const rateLimitDoc = await rateLimitRef.get();

  if (!rateLimitDoc.exists) {
    return { allowed: true };
  }

  const rateLimit = rateLimitDoc.data()!;
  const now = Date.now();

  if (rateLimit.blockedUntil && now < rateLimit.blockedUntil) {
    return {
      allowed: false,
      blockedUntil: rateLimit.blockedUntil,
    };
  }

  const timeSince5Min = now - (rateLimit.lastSmsTime || 0);
  const smsCountIn5Min =
    timeSince5Min < 300000 ? rateLimit.smsCount5Min || 0 : 0;

  if (smsCountIn5Min >= SMS_RATE_LIMIT.SMS_MAX_PER_5_MIN) {
    return {
      allowed: false,
      blockedUntil: (rateLimit.lastSmsTime || 0) + 300000,
      smsCountIn5Min,
    };
  }

  const timeSinceDay = now - (rateLimit.dayResetTime || now);
  const smsCountToday =
    timeSinceDay < 86400000 ? rateLimit.smsCountDay || 0 : 0;

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
}

async function recordSmsSend(normalizedPhoneNumber: string): Promise<void> {
  const rateLimitRef = db
    .collection('sms_rate_limits')
    .doc(normalizedPhoneNumber);

  const now = Date.now();

  await db.runTransaction(async transaction => {
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

      return;
    }

    const rateLimit = doc.data()!;
    const timeSince5Min = now - (rateLimit.lastSmsTime || 0);
    const timeSinceDay = now - (rateLimit.dayResetTime || now);

    transaction.update(rateLimitRef, {
      smsCount5Min:
        timeSince5Min < 300000 ? (rateLimit.smsCount5Min || 0) + 1 : 1,
      smsCountDay:
        timeSinceDay < 86400000 ? (rateLimit.smsCountDay || 0) + 1 : 1,
      lastSmsTime: now,
      dayResetTime:
        timeSinceDay >= 86400000 ? now : rateLimit.dayResetTime,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}