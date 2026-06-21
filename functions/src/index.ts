import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import crypto from 'crypto';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

const REGION = 'us-central1';
const smsCodeSecret = defineSecret('SMS_CODE_SECRET');
const smsApiToken = defineSecret('SMS_API_TOKEN');
const smsCallableOptions = { region: REGION, secrets: [smsCodeSecret] };
const smsSendCallableOptions = { region: REGION, secrets: [smsCodeSecret, smsApiToken] };
const callableOptions = { region: REGION };

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

function removeUndefinedValues<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

function resolveRateLimitTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isDevEnv(): boolean {
  return process.env.FUNCTIONS_EMULATOR === 'true';
}

function isFunctionsEmulator(): boolean {
  return process.env.FUNCTIONS_EMULATOR === 'true';
}

function maskPhone(phoneNumber: string): string {
  const compact = phoneNumber.replace(/\s/g, '');
  if (compact.length <= 4) {
    return '****';
  }

  const visibleSuffix = compact.slice(-3);
  if (compact.startsWith('+48') && compact.length >= 6) {
    return `+48******${visibleSuffix}`;
  }

  return `${compact.slice(0, 3)}******${visibleSuffix}`;
}

function logRegistrationSmsStep(step: string, details: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ scope: 'sendRegistrationSmsCode', step, ...details }));
}

function logRegisterResidentStep(step: string, details: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ scope: 'registerResidentAccount', step, ...details }));
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
  const secretFromEnv = process.env.SMS_CODE_SECRET?.trim();
  if (secretFromEnv) {
    return secretFromEnv;
  }

  try {
    const secret = smsCodeSecret.value()?.trim();
    if (secret) {
      return secret;
    }
  } catch {
    // Secret is not bound to this runtime (e.g. local emulator without params).
  }

  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    return 'local-emulator-secret-change-me';
  }

  throw new HttpsError('internal', 'Brak konfiguracji SMS_CODE_SECRET.');
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
  if (isFunctionsEmulator()) {
    console.info(
      JSON.stringify({
        scope: 'sendSms',
        step: 'emulator_skip',
        context,
      })
    );
    return;
  }

  const provider = process.env.SMS_PROVIDER?.trim();
  if (!provider) {
    throw new HttpsError('failed-precondition', 'SMS provider is not configured');
  }

  if (provider !== 'smsapi') {
    throw new HttpsError('failed-precondition', `Unsupported SMS provider: ${provider}`);
  }

  let token = process.env.SMS_API_TOKEN?.trim() ?? '';
  if (!token) {
    try {
      token = smsApiToken.value()?.trim() ?? '';
    } catch {
      token = '';
    }
  }

  if (!token) {
    throw new HttpsError('failed-precondition', 'SMS API token is not configured');
  }

  const normalizedForSmsApi = phoneNumber.replace('+', '');
  const isPasswordReset = context === 'password_reset' || context === 'password-reset';
  const message = isPasswordReset
    ? `Kod resetu hasla Powiat Decyduje: ${code}`
    : `Kod rejestracji Powiat Decyduje: ${code}`;

  const body = new URLSearchParams({
    to: normalizedForSmsApi,
    message,
    format: 'json',
  });

  const from = process.env.SMS_FROM?.trim();
  if (from) {
    body.set('from', from);
  }

  const response = await fetch('https://api.smsapi.pl/sms.do', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      JSON.stringify({
        scope: 'sendSms',
        step: 'smsapi_error',
        status: response.status,
        context,
        response: responseText.slice(0, 500),
      })
    );
    throw new HttpsError('internal', 'SMS provider rejected the message');
  }

  console.info(
    JSON.stringify({
      scope: 'sendSms',
      step: 'smsapi_sent',
      status: response.status,
      context,
    })
  );
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

  const smsCount5Min =
    now - resolveRateLimitTimestamp(rateLimit.lastSmsTime, 0) < 5 * 60 * 1000 ? rateLimit.smsCount5Min : 0;
  if (smsCount5Min >= SMS_RATE_LIMIT.MAX_SMS_PER_5_MIN) {
    throw new HttpsError('resource-exhausted', 'Przekroczono limit wysylek SMS. Sprobuj pozniej.');
  }

  const dayResetTime = resolveRateLimitTimestamp(rateLimit.dayResetTime, 0);
  const smsCountDay = now - dayResetTime < 24 * 60 * 60 * 1000 ? rateLimit.smsCountDay : 0;
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
      transaction.set(
        ref,
        removeUndefinedValues({
          smsCount5Min: 1,
          smsCountDay: 1,
          lastSmsTime: now,
          dayResetTime: now,
          blockedUntil: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
      return;
    }

    const data = snapshot.data() as Partial<SmsRateLimitDoc>;
    const lastSmsTime = resolveRateLimitTimestamp(data.lastSmsTime, now);
    const dayResetTime = resolveRateLimitTimestamp(data.dayResetTime, now);
    const timeSince5Min = now - lastSmsTime;
    const timeSinceDay = now - dayResetTime;
    const nextDayResetTime = timeSinceDay >= 24 * 60 * 60 * 1000 ? now : dayResetTime;

    transaction.update(
      ref,
      removeUndefinedValues({
        smsCount5Min: timeSince5Min < 5 * 60 * 1000 ? (data.smsCount5Min ?? 0) + 1 : 1,
        smsCountDay: timeSinceDay < 24 * 60 * 60 * 1000 ? (data.smsCountDay ?? 0) + 1 : 1,
        lastSmsTime: now,
        dayResetTime: nextDayResetTime,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    );
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

  if (process.env.FUNCTIONS_EMULATOR === 'true' && smsCode === '000000') {
    return snapshot;
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

export const sendRegistrationSmsCode = onCall(smsSendCallableOptions, async (request) => {
  let normalizedPhoneNumber = '';

  try {
    logRegistrationSmsStep('start');

    const phoneNumber = typeof request.data?.phoneNumber === 'string' ? request.data.phoneNumber : '';
    normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    logRegistrationSmsStep('phone_normalized', { phone: maskPhone(normalizedPhoneNumber) });

    await checkSmsRateLimit(normalizedPhoneNumber);
    logRegistrationSmsStep('rate_limit_checked', { phone: maskPhone(normalizedPhoneNumber) });

    const phoneIndexSnapshot = await db.collection('auth_index_phone').doc(normalizedPhoneNumber).get();
    const phoneIndexData = phoneIndexSnapshot.data() as { accountCount?: number } | undefined;
    if ((phoneIndexData?.accountCount ?? 0) >= MAX_PHONE_ACCOUNTS) {
      throw new HttpsError('resource-exhausted', 'Limit kont dla numeru telefonu zostal przekroczony.');
    }
    logRegistrationSmsStep('phone_limit_checked', {
      phone: maskPhone(normalizedPhoneNumber),
      accountCount: phoneIndexData?.accountCount ?? 0,
    });

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
    logRegistrationSmsStep('verification_saved', {
      verificationId,
      phone: maskPhone(normalizedPhoneNumber),
      expiresAt,
    });

    await recordSmsSend(normalizedPhoneNumber);
    logRegistrationSmsStep('rate_limit_recorded', { phone: maskPhone(normalizedPhoneNumber) });

    logRegistrationSmsStep('send_sms_start', {
      phone: maskPhone(normalizedPhoneNumber),
      context: 'registration',
      emulator: isFunctionsEmulator(),
      providerConfigured: Boolean(process.env.SMS_PROVIDER?.trim()),
    });
    await sendSms(normalizedPhoneNumber, code, 'registration');
    logRegistrationSmsStep('send_sms_done', {
      phone: maskPhone(normalizedPhoneNumber),
      context: 'registration',
    });

    logRegistrationSmsStep('success', {
      verificationId,
      phone: maskPhone(normalizedPhoneNumber),
      expiresAt,
    });

    return { verificationId, normalizedPhoneNumber, expiresAt };
  } catch (error) {
    logRegistrationSmsStep('error', {
      phone: normalizedPhoneNumber ? maskPhone(normalizedPhoneNumber) : '-',
      errorCode: error instanceof HttpsError ? error.code : 'unknown',
      errorMessage: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
});

export const verifyRegistrationSmsCode = onCall(smsCallableOptions, async (request) => {
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

export const registerResidentAccount = onCall(callableOptions, async (request) => {
  let normalizedPhoneNumber = '';

  try {
    logRegisterResidentStep('register_start');

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

    normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
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

    logRegisterResidentStep('verification_checked', { phone: maskPhone(normalizedPhoneNumber) });

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

    const requiredConsents = [
      'residentDeclaration',
      'termsAccepted',
      'privacyPolicyAccepted',
      'personalDataProcessingAccepted',
    ] as const;

    for (const consentKey of requiredConsents) {
      if (consents[consentKey] !== true) {
        throw new HttpsError('invalid-argument', 'Brak wymaganych zgod.');
      }
    }

    if (!address.street || !address.houseNumber || !address.postalCode || !address.city) {
      throw new HttpsError('invalid-argument', 'Brak wymaganych danych adresowych.');
    }

    logRegisterResidentStep('resident_profile_prepare', { uid, phone: maskPhone(normalizedPhoneNumber) });

    const now = admin.firestore.Timestamp.now();

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
        const existingAccounts = Array.isArray(userData?.residentAccounts)
          ? (userData?.residentAccounts as Record<string, unknown>[])
          : [];
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
          createdAt: now,
          updatedAt: now,
        };

        const nextAccounts = hasExistingAccount
          ? existingAccounts.map((account) => {
              if (String(account?.id ?? account?.pesel ?? '') !== pesel) {
                return account;
              }

              return {
                ...account,
                ...residentAccount,
                createdAt: account.createdAt ?? now,
              };
            })
          : [...existingAccounts, residentAccount];

        const phoneIndexData = phoneIndexSnapshot.data() as
          | { accountCount?: number; residentAccountIds?: string[]; uids?: string[] }
          | undefined;
        const phoneAccountCount = phoneIndexData?.accountCount ?? nextAccounts.length;
        if (!hasExistingAccount && phoneAccountCount >= MAX_PHONE_ACCOUNTS) {
          throw new HttpsError('resource-exhausted', 'Limit kont dla numeru telefonu zostal przekroczony.');
        }

        const residentAccountIds = Array.from(
          new Set([
            ...(phoneIndexData?.residentAccountIds ?? []),
            ...nextAccounts.map((account) => String(account.id ?? '')),
          ])
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
            createdAt: userSnapshot.exists
              ? userData?.createdAt ?? admin.firestore.FieldValue.serverTimestamp()
              : admin.firestore.FieldValue.serverTimestamp(),
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
            createdAt: phoneIndexSnapshot.exists
              ? (phoneIndexSnapshot.data() as Record<string, unknown>)?.createdAt ??
                admin.firestore.FieldValue.serverTimestamp()
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
            createdAt: peselIndexSnapshot.exists
              ? (peselIndexSnapshot.data() as Record<string, unknown>)?.createdAt ??
                admin.firestore.FieldValue.serverTimestamp()
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

    logRegisterResidentStep('resident_profile_saved', { uid, phone: maskPhone(normalizedPhoneNumber) });
    logRegisterResidentStep('success', { uid, phone: maskPhone(normalizedPhoneNumber) });

    return { uid, email };
  } catch (error) {
    logRegisterResidentStep('error', {
      phone: normalizedPhoneNumber ? maskPhone(normalizedPhoneNumber) : '-',
      errorCode: error instanceof HttpsError ? error.code : 'unknown',
      errorMessage: error instanceof Error ? error.message : 'unknown',
    });
    throw error;
  }
});

export const sendPasswordResetSmsCode = onCall(smsSendCallableOptions, async (request) => {
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

export const verifyPasswordResetSmsCode = onCall(smsCallableOptions, async (request) => {
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

export const resetPasswordWithSmsCode = onCall(smsCallableOptions, async (request) => {
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

export const resolveLoginIdentifier = onCall(callableOptions, async (request) => {
  const identifier = typeof request.data?.identifier === 'string' ? request.data.identifier.trim() : '';
  if (!identifier) {
    throw new HttpsError('invalid-argument', 'Brak identyfikatora logowania.');
  }

  if (identifier.includes('@')) {
    return { emails: [identifier.trim().toLowerCase()] };
  }

  let normalizedPhoneNumber: string;
  try {
    normalizedPhoneNumber = normalizePhoneNumber(identifier);
  } catch {
    return { emails: [] };
  }

  const phoneIndexSnapshot = await db.collection('auth_index_phone').doc(normalizedPhoneNumber).get();
  if (!phoneIndexSnapshot.exists) {
    return { emails: [] };
  }

  const phoneIndexData = phoneIndexSnapshot.data() as { uid?: string; uids?: string[] } | undefined;
  const uidCandidates = Array.from(
    new Set(
      [
        ...(Array.isArray(phoneIndexData?.uids) ? phoneIndexData.uids : []),
        typeof phoneIndexData?.uid === 'string' ? phoneIndexData.uid : null,
      ].filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );

  const emails: string[] = [];
  for (const uid of uidCandidates) {
    try {
      const userRecord = await auth.getUser(uid);
      if (userRecord.email) {
        emails.push(userRecord.email.trim().toLowerCase());
      }
    } catch {
      // Ignore stale auth references and continue.
    }
  }

  return { emails: [...new Set(emails)] };
});
