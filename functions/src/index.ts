import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import crypto from 'crypto';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

const REGION = 'us-central1';

const SMS_RATE_LIMIT = {
  MAX_SMS_PER_5_MIN: 3,
  MAX_SMS_PER_DAY: 10,
  SMS_CODE_EXPIRY_MS: 10 * 60 * 1000,
  MAX_VERIFY_ATTEMPTS: 5,
  VERIFY_BLOCK_MS: 15 * 60 * 1000,
};

const MAX_PHONE_ACCOUNTS = 5;

type SmsVerificationType = 'registration' | 'password_reset';

type SmsVerificationDoc = {
  type: SmsVerificationType;
  phoneNumber: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  blockedUntil: number | null;
  status: 'pending' | 'verified' | 'used';
  uid?: string | null;
  verifiedAt?: admin.firestore.FieldValue | null;
  usedAt?: admin.firestore.FieldValue | null;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
};

type SmsRateLimitDoc = {
  smsCount5Min: number;
  smsCountDay: number;
  lastSmsTime: number;
  dayResetTime: number;
  blockedUntil: number | null;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
};

function isDevEnv(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function maskPhone(phoneNumber: string): string {
  return phoneNumber.replace(/\d(?=\d{2})/g, '*');
}

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (/^\d{9}$/.test(digits)) {
    return `+48${digits}`;
  }
  if (/^48\d{9}$/.test(digits)) {
    return `+${digits}`;
  }
  throw new HttpsError('invalid-argument', 'Nieprawidlowy numer telefonu.');
}

function assertValidPesel(pesel: string): void {
  if (!/^\d{11}$/.test(pesel)) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowy numer PESEL.');
  }
  const digits = pesel.split('').map(Number);
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = weights.reduce((acc, weight, index) => acc + weight * digits[index], 0);
  const checksum = (10 - (sum % 10)) % 10;
  if (checksum !== digits[10]) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowy numer PESEL.');
  }
}

function getSmsCodeSecret(): string {
  const secret = process.env.SMS_CODE_SECRET;
  if (!secret) {
    throw new HttpsError('internal', 'Brak konfiguracji SMS_CODE_SECRET.');
  }
  return secret;
}

function hashSmsCode(code: string, verificationId: string): string {
  const secret = getSmsCodeSecret();
  return crypto
    .createHash('sha256')
    .update(`${code}.${verificationId}.${secret}`)
    .digest('hex');
}

function createVerificationId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function sendSms(phoneNumber: string, code: string, context: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER;
  if (!provider) {
    if (isDevEnv()) {
      console.log(`[SMS][DEV] TODO: integrate SMSAPI. (${context}) code=${code} phone=${maskPhone(phoneNumber)}`);
      return;
    }
    throw new HttpsError('failed-precondition', 'SMS provider nie jest skonfigurowany.');
  }

  if (isDevEnv()) {
    console.log(`[SMS][DEV] Provider ${provider} not configured. (${context})`);
  }

  throw new HttpsError('failed-precondition', 'SMS provider nie jest skonfigurowany.');
}

async function checkSmsRateLimit(normalizedPhoneNumber: string): Promise<void> {
  const ref = db.collection('sms_rate_limits').doc(normalizedPhoneNumber);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    return;
  }

  const rateLimit = snapshot.data() as SmsRateLimitDoc;
  const now = Date.now();

  if (rateLimit.blockedUntil && now < rateLimit.blockedUntil) {
    throw new HttpsError('resource-exhausted', 'Przekroczono limit wysylek SMS. Sprobuj pozniej.');
  }

  const smsCount5Min = now - rateLimit.lastSmsTime < 5 * 60 * 1000 ? rateLimit.smsCount5Min : 0;
  if (smsCount5Min >= SMS_RATE_LIMIT.MAX_SMS_PER_5_MIN) {
    throw new HttpsError('resource-exhausted', 'Przekroczono limit wysylek SMS. Sprobuj pozniej.');
  }

  const smsCountDay = now - rateLimit.dayResetTime < 24 * 60 * 60 * 1000 ? rateLimit.smsCountDay : 0;
  if (smsCountDay >= SMS_RATE_LIMIT.MAX_SMS_PER_DAY) {
    throw new HttpsError('resource-exhausted', 'Przekroczono limit wysylek SMS. Sprobuj pozniej.');
  }
}

async function recordSmsSend(normalizedPhoneNumber: string): Promise<void> {
  const ref = db.collection('sms_rate_limits').doc(normalizedPhoneNumber);
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      transaction.set(ref, {
        smsCount5Min: 1,
        smsCountDay: 1,
        lastSmsTime: now,
        dayResetTime: now,
        blockedUntil: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      } satisfies SmsRateLimitDoc);
      return;
    }

    const data = snapshot.data() as SmsRateLimitDoc;
    const timeSince5Min = now - data.lastSmsTime;
    const timeSinceDay = now - data.dayResetTime;

    transaction.update(ref, {
      smsCount5Min: timeSince5Min < 5 * 60 * 1000 ? data.smsCount5Min + 1 : 1,
      smsCountDay: timeSinceDay < 24 * 60 * 60 * 1000 ? data.smsCountDay + 1 : 1,
      lastSmsTime: now,
      dayResetTime: timeSinceDay >= 24 * 60 * 60 * 1000 ? now : data.dayResetTime,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } satisfies Partial<SmsRateLimitDoc>);
  });
}

async function verifySmsCode(
  verificationId: string,
  smsCode: string,
  expectedType: SmsVerificationType,
  normalizedPhoneNumber?: string
): Promise<admin.firestore.DocumentSnapshot> {
  const ref = db.collection('sms_verifications').doc(verificationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono weryfikacji.');
  }

  const data = snapshot.data() as SmsVerificationDoc;
  const now = Date.now();

  if (data.type !== expectedType) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowa weryfikacja.');
  }

  if (normalizedPhoneNumber && data.phoneNumber !== normalizedPhoneNumber) {
    throw new HttpsError('permission-denied', 'Nieprawidlowy numer telefonu.');
  }

  if (data.status === 'used') {
    throw new HttpsError('invalid-argument', 'Kod SMS zostal juz wykorzystany.');
  }

  if (now > data.expiresAt) {
    throw new HttpsError('invalid-argument', 'Kod SMS wygasl.');
  }

  if (data.blockedUntil && now < data.blockedUntil) {
    throw new HttpsError('resource-exhausted', 'Przekroczono limit prob. Sprobuj pozniej.');
  }

  const expectedHash = hashSmsCode(smsCode, verificationId);
  if (expectedHash !== data.codeHash) {
    const attempts = (data.attempts || 0) + 1;
    const blockedUntil =
      attempts >= SMS_RATE_LIMIT.MAX_VERIFY_ATTEMPTS ? now + SMS_RATE_LIMIT.VERIFY_BLOCK_MS : null;
    await ref.update({
      attempts,
      blockedUntil,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new HttpsError('invalid-argument', 'Nieprawidlowy kod SMS.');
  }

  return snapshot;
}

function assertSmsCodeShape(code: string): void {
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowy kod SMS.');
  }
}

export const sendRegistrationSmsCode = onCall({ region: REGION }, async (request) => {
  const phoneNumber = typeof request.data?.phoneNumber === 'string' ? request.data.phoneNumber : '';
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  await checkSmsRateLimit(normalizedPhoneNumber);

  const phoneIndexSnapshot = await db.collection('auth_index_phone').doc(normalizedPhoneNumber).get();
  const phoneIndexData = phoneIndexSnapshot.data() as { accountCount?: number } | undefined;
  if ((phoneIndexData?.accountCount ?? 0) >= MAX_PHONE_ACCOUNTS) {
    throw new HttpsError('resource-exhausted', 'Limit kont dla numeru telefonu zostal przekroczony.');
  }

  const verificationId = createVerificationId('reg');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + SMS_RATE_LIMIT.SMS_CODE_EXPIRY_MS;

  await db.collection('sms_verifications').doc(verificationId).set({
    type: 'registration',
    phoneNumber: normalizedPhoneNumber,
    codeHash: hashSmsCode(code, verificationId),
    expiresAt,
    attempts: 0,
    blockedUntil: null,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  } satisfies SmsVerificationDoc);

  await recordSmsSend(normalizedPhoneNumber);
  await sendSms(normalizedPhoneNumber, code, 'registration');

  return { verificationId, normalizedPhoneNumber, expiresAt };
});

export const verifyRegistrationSmsCode = onCall({ region: REGION }, async (request) => {
  const verificationId = typeof request.data?.verificationId === 'string' ? request.data.verificationId : '';
  const smsCode = typeof request.data?.code === 'string' ? request.data.code.trim() : '';

  if (!verificationId) {
    throw new HttpsError('invalid-argument', 'Brak verificationId.');
  }
  assertSmsCodeShape(smsCode);

  const snapshot = await verifySmsCode(verificationId, smsCode, 'registration');
  const data = snapshot.data() as SmsVerificationDoc;

  await snapshot.ref.update({
    status: 'verified',
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    verificationId,
    normalizedPhoneNumber: data.phoneNumber,
    expiresAt: data.expiresAt,
  };
});

export const registerResidentAccount = onCall({ region: REGION }, async (request) => {
  const data = request.data as Record<string, unknown>;
  const verificationId = typeof data?.verificationId === 'string' ? data.verificationId : '';
  const phoneNumber = typeof data?.phoneNumber === 'string' ? data.phoneNumber : '';
  const pesel = typeof data?.pesel === 'string' ? data.pesel.trim() : '';
  const email = typeof data?.email === 'string' ? data.email.trim() : '';
  const password = typeof data?.password === 'string' ? data.password : '';
  const firstName = typeof data?.firstName === 'string' ? data.firstName.trim() : '';
  const lastName = typeof data?.lastName === 'string' ? data.lastName.trim() : '';

  if (!verificationId || !phoneNumber || !pesel || !email || !firstName || !lastName) {
    throw new HttpsError('invalid-argument', 'Brak wymaganych danych rejestracji.');
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  assertValidPesel(pesel);

  const verificationRef = db.collection('sms_verifications').doc(verificationId);
  const verificationSnapshot = await verificationRef.get();
  if (!verificationSnapshot.exists) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowa weryfikacja telefonu.');
  }

  const verification = verificationSnapshot.data() as SmsVerificationDoc;
  if (verification.type !== 'registration' || verification.status !== 'verified') {
    throw new HttpsError('invalid-argument', 'Nieprawidlowa weryfikacja telefonu.');
  }

  if (verification.phoneNumber !== normalizedPhoneNumber) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowy numer telefonu.');
  }

  if (Date.now() > verification.expiresAt) {
    throw new HttpsError('invalid-argument', 'Weryfikacja telefonu wygasla.');
  }

  let uid = request.auth?.uid ?? null;
  let emailVerified = request.auth?.token?.email_verified === true;
  let createdUserUid: string | null = null;

  if (!uid) {
    if (!password || password.length < 8) {
      throw new HttpsError('invalid-argument', 'Haslo musi miec co najmniej 8 znakow.');
    }
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
    });
    uid = userRecord.uid;
    createdUserUid = userRecord.uid;
    emailVerified = userRecord.emailVerified;
  }

  const address = typeof data?.address === 'object' && data.address ? (data.address as Record<string, string>) : {};
  const consents = typeof data?.consents === 'object' && data.consents ? (data.consents as Record<string, boolean>) : {};

  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(uid as string);
      const phoneIndexRef = db.collection('auth_index_phone').doc(normalizedPhoneNumber);
      const peselIndexRef = db.collection('auth_index_pesel').doc(pesel);

      const [userSnapshot, phoneIndexSnapshot, peselIndexSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(phoneIndexRef),
        transaction.get(peselIndexRef),
      ]);

      if (peselIndexSnapshot.exists) {
        const peselIndexData = peselIndexSnapshot.data() as { uid?: string } | undefined;
        if (peselIndexData?.uid && peselIndexData.uid !== uid) {
          throw new HttpsError('already-exists', 'Nie mozna zarejestrowac konta.');
        }
      }

      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const existingAccounts = Array.isArray(userData?.residentAccounts) ? (userData?.residentAccounts as Record<string, unknown>[]) : [];
      const existingIds = new Set(existingAccounts.map((account) => String(account?.id ?? account?.pesel ?? '')));
      const hasExistingAccount = existingIds.has(pesel);

      const residentAccount = {
        id: pesel,
        pesel,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phoneNumber: normalizedPhoneNumber,
        phoneVerified: true,
        emailVerified,
        address: {
          street: String(address.street ?? ''),
          houseNumber: String(address.houseNumber ?? ''),
          apartmentNumber: address.apartmentNumber ? String(address.apartmentNumber) : null,
          postalCode: String(address.postalCode ?? ''),
          city: String(address.city ?? ''),
          commune: String(address.commune ?? ''),
        },
        commune: String(address.commune ?? ''),
        county: String(data?.county ?? ''),
        residentStatus: 'verified_resident',
        consents: {
          residentDeclaration: Boolean(consents.residentDeclaration),
          termsAccepted: Boolean(consents.termsAccepted),
          privacyPolicyAccepted: Boolean(consents.privacyPolicyAccepted),
          personalDataProcessingAccepted: Boolean(consents.personalDataProcessingAccepted),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const nextAccounts = hasExistingAccount
        ? existingAccounts.map((account) =>
            String(account?.id ?? account?.pesel ?? '') === pesel ? { ...account, ...residentAccount } : account
          )
        : [...existingAccounts, residentAccount];

      const phoneIndexData = phoneIndexSnapshot.data() as { accountCount?: number; residentAccountIds?: string[]; uids?: string[] } | undefined;
      const phoneAccountCount = phoneIndexData?.accountCount ?? nextAccounts.length;
      if (!hasExistingAccount && phoneAccountCount >= MAX_PHONE_ACCOUNTS) {
        throw new HttpsError('resource-exhausted', 'Limit kont dla numeru telefonu zostal przekroczony.');
      }

      const residentAccountIds = Array.from(
        new Set([...(phoneIndexData?.residentAccountIds ?? []), ...nextAccounts.map((account) => String(account.id ?? ''))])
      );
      const uids = Array.from(new Set([...(phoneIndexData?.uids ?? []), uid as string]));

      transaction.set(
        userRef,
        {
          uid,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          email,
          phoneNumber: normalizedPhoneNumber,
          pesel,
          address: residentAccount.address,
          commune: residentAccount.commune,
          county: residentAccount.county,
          residentStatus: residentAccount.residentStatus,
          phoneVerified: true,
          emailVerified,
          consents: residentAccount.consents,
          residentAccounts: nextAccounts,
          activeResidentAccountId: pesel,
          createdAt: userSnapshot.exists() ? userData?.createdAt ?? admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      transaction.set(
        phoneIndexRef,
        {
          normalizedPhoneNumber,
          uid,
          uids,
          residentAccountIds,
          accountCount: residentAccountIds.length,
          createdAt: phoneIndexSnapshot.exists()
            ? (phoneIndexSnapshot.data() as Record<string, unknown>)?.createdAt ?? admin.firestore.FieldValue.serverTimestamp()
            : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      transaction.set(
        peselIndexRef,
        {
          pesel,
          uid,
          residentAccountId: pesel,
          createdAt: peselIndexSnapshot.exists()
            ? (peselIndexSnapshot.data() as Record<string, unknown>)?.createdAt ?? admin.firestore.FieldValue.serverTimestamp()
            : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      transaction.update(verificationRef, {
        status: 'used',
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (createdUserUid) {
      await auth.deleteUser(createdUserUid);
    }
    throw error;
  }

  if (isDevEnv()) {
    console.log('[SMS][DEV] Registration completed', { uid, phone: maskPhone(normalizedPhoneNumber) });
  }

  return { uid, email };
});

export const sendPasswordResetSmsCode = onCall({ region: REGION }, async (request) => {
  const phoneNumber = typeof request.data?.phoneNumber === 'string' ? request.data.phoneNumber : '';
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  await checkSmsRateLimit(normalizedPhoneNumber);

  const phoneIndexSnapshot = await db.collection('auth_index_phone').doc(normalizedPhoneNumber).get();
  const phoneIndexData = phoneIndexSnapshot.data() as { uid?: string } | undefined;
  const uid = phoneIndexData?.uid ?? null;

  const verificationId = createVerificationId('pwd');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + SMS_RATE_LIMIT.SMS_CODE_EXPIRY_MS;

  await db.collection('sms_verifications').doc(verificationId).set({
    type: 'password_reset',
    phoneNumber: normalizedPhoneNumber,
    codeHash: hashSmsCode(code, verificationId),
    expiresAt,
    attempts: 0,
    blockedUntil: null,
    status: 'pending',
    uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  } satisfies SmsVerificationDoc);

  await recordSmsSend(normalizedPhoneNumber);
  if (uid) {
    await sendSms(normalizedPhoneNumber, code, 'password_reset');
  }

  return { verificationId, expiresAt };
});

export const verifyPasswordResetSmsCode = onCall({ region: REGION }, async (request) => {
  const verificationId = typeof request.data?.verificationId === 'string' ? request.data.verificationId : '';
  const smsCode = typeof request.data?.code === 'string' ? request.data.code.trim() : '';

  if (!verificationId) {
    throw new HttpsError('invalid-argument', 'Brak verificationId.');
  }
  assertSmsCodeShape(smsCode);

  const snapshot = await verifySmsCode(verificationId, smsCode, 'password_reset');
  const data = snapshot.data() as SmsVerificationDoc;

  await snapshot.ref.update({
    status: 'verified',
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { verificationId, normalizedPhoneNumber: data.phoneNumber, expiresAt: data.expiresAt };
});

export const resetPasswordWithSmsCode = onCall({ region: REGION }, async (request) => {
  const verificationId = typeof request.data?.verificationId === 'string' ? request.data.verificationId : '';
  const smsCode = typeof request.data?.code === 'string' ? request.data.code.trim() : '';
  const newPassword = typeof request.data?.newPassword === 'string' ? request.data.newPassword : '';

  if (!verificationId || !newPassword) {
    throw new HttpsError('invalid-argument', 'Brak wymaganych danych.');
  }
  if (newPassword.length < 8) {
    throw new HttpsError('invalid-argument', 'Haslo musi miec co najmniej 8 znakow.');
  }
  assertSmsCodeShape(smsCode);

  const snapshot = await verifySmsCode(verificationId, smsCode, 'password_reset');
  const data = snapshot.data() as SmsVerificationDoc;

  if (!data.uid) {
    throw new HttpsError('invalid-argument', 'Nieprawidlowy kod SMS.');
  }

  await auth.updateUser(data.uid, { password: newPassword });

  await snapshot.ref.update({
    status: 'used',
    usedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});
