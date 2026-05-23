import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type PhoneAuthCredential,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

import { isDevSmsBypassEnabled } from '@/src/config/env';
import {
  COMMUNE_NAME,
  COUNTY_NAME,
  normalizePeselInput,
  normalizePhoneInput,
  type ResidentRegistrationFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { auth, db, functions } from '@/src/lib/firebase';

const MAX_PHONE_ACCOUNTS = 5;
const DEV_BYPASS_PHONE = '+48500400300';
const DEV_BYPASS_VERIFICATION_ID = 'dev-bypass-510490044';
const DEV_BYPASS_CODE = '123456';

// SMS Security Constants
const SMS_RATE_LIMIT = {
  MAX_SMS_PER_5_MIN: 3,
  MAX_SMS_PER_DAY: 10,
  BLOCK_DURATION_MS: 1 * 60 * 60 * 1000, // 1 hour
  SMS_CODE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  MAX_VERIFICATION_ATTEMPTS: 5,
  ATTEMPT_BLOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  RESEND_COOLDOWN_MS: 30 * 1000, // 30 seconds
  MAX_RESENDS: 5,
};

type ResidentConsents = {
  residentDeclaration: boolean;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  personalDataProcessingAccepted: boolean;
};

type ResidentAddress = {
  street: string;
  houseNumber: string;
  apartmentNumber: string | null;
  postalCode: string;
  city: string;
  commune: string;
};

type ResidentAccountData = {
  id: string;
  pesel: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  address: ResidentAddress;
  commune: string;
  county: string;
  residentStatus: 'verified_resident';
  consents: ResidentConsents;
  createdAt?: unknown;
  updatedAt?: unknown;
  label?: string;
};

type ResidentHouseholdData = {
  uid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  pesel: string;
  address: ResidentAddress;
  commune: string;
  county: string;
  residentStatus: 'verified_resident';
  phoneVerified: boolean;
  emailVerified: boolean;
  consents: ResidentConsents;
  residentAccounts: ResidentAccountData[];
  activeResidentAccountId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ResidentAccount = ResidentAccountData;

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type EmailPasswordLoginPayload = {
  email: string;
  password: string;
};

export type ResidentRegistrationAvailabilityPayload = {
  phoneNumber: string;
  pesel: string;
};

export type ResidentRegistrationAvailabilityResult = {
  phoneRegistered: boolean;
  peselTaken: boolean;
  phoneAccountsCount: number;
  phoneLimitReached: boolean;
};

export type ResidentPhoneVerificationPayload = {
  phoneNumber: string;
};

export type ResidentPhoneVerificationResult = {
  verificationId: string;
  normalizedPhoneNumber: string;
  expiresAt: number;
};

export type ConfirmResidentPhoneVerificationPayload = {
  verificationId: string;
  smsCode: string;
  phoneNumber: string;
};

export type ResidentLoginTarget = {
  uid: string;
  email: string;
  phoneNumber: string;
  residentAccounts: ResidentAccount[];
  matchedResidentAccount: ResidentAccount | null;
  requiresSelection: boolean;
};

export type PasswordResetRequest = {
  identifier: string;
};

export type SmsRateLimitStatus = {
  allowed: boolean;
  reason?: string;
  blockedUntil?: number;
  attemptsRemaining?: number;
};

function requireAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  return auth;
}

function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firebase Firestore is not configured. Check EXPO_PUBLIC_FIREBASE_* values.');
  }

  return db;
}

export function normalizePhoneNumber(rawPhoneNumber: string): string {
  return normalizePhoneInput(rawPhoneNumber);
}

export function normalizePesel(rawPesel: string): string {
  return normalizePeselInput(rawPesel);
}

function isDevBypassPhone(phoneNumber: string): boolean {
  return __DEV__ && isDevSmsBypassEnabled && normalizePhoneNumber(phoneNumber) === DEV_BYPASS_PHONE;
}

function isDevBypassVerification(verificationId: string, phoneNumber: string): boolean {
  return isDevSmsBypassEnabled && isDevBypassPhone(phoneNumber) && verificationId === DEV_BYPASS_VERIFICATION_ID;
}

function isValidSmsCodeShape(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

async function ensureUserToken(user: User): Promise<void> {
  await user.getIdToken(true);
}

function phoneIndexRef(dbInstance: Firestore, normalizedPhoneNumber: string) {
  return doc(dbInstance, 'auth_index_phone', normalizedPhoneNumber);
}

function peselIndexRef(dbInstance: Firestore, normalizedPesel: string) {
  return doc(dbInstance, 'auth_index_pesel', normalizedPesel);
}

function formatResidentLabel(account: Pick<ResidentAccountData, 'fullName' | 'pesel'>): string {
  const fullName = account.fullName.trim();
  if (fullName.length > 0) {
    return fullName;
  }

  return `Konto ${account.pesel.slice(-4)}`;
}

function mapResidentAccount(raw: DocumentData | undefined): ResidentAccount | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const id = typeof raw.id === 'string' ? raw.id : typeof raw.pesel === 'string' ? raw.pesel : null;
  const pesel = typeof raw.pesel === 'string' ? raw.pesel : null;
  const firstName = typeof raw.firstName === 'string' ? raw.firstName : '';
  const lastName = typeof raw.lastName === 'string' ? raw.lastName : '';
  const email = typeof raw.email === 'string' ? raw.email : '';
  const phoneNumber = typeof raw.phoneNumber === 'string' ? raw.phoneNumber : '';

  if (!id || !pesel || !phoneNumber) {
    return null;
  }

  const address = raw.address && typeof raw.address === 'object' ? (raw.address as ResidentAddress) : null;
  const consents = raw.consents && typeof raw.consents === 'object' ? (raw.consents as ResidentConsents) : null;
  const fullName =
    typeof raw.fullName === 'string' && raw.fullName.trim().length > 0
      ? raw.fullName.trim()
      : `${firstName} ${lastName}`.trim();

  return {
    id,
    pesel,
    firstName,
    lastName,
    fullName,
    email,
    phoneNumber,
    phoneVerified: raw.phoneVerified === true,
    emailVerified: raw.emailVerified === true,
    address:
      address ?? {
        street: '',
        houseNumber: '',
        apartmentNumber: null,
        postalCode: '',
        city: '',
        commune: COMMUNE_NAME,
      },
    commune: typeof raw.commune === 'string' ? raw.commune : COMMUNE_NAME,
    county: typeof raw.county === 'string' ? raw.county : COUNTY_NAME,
    residentStatus: 'verified_resident',
    consents:
      consents ?? {
        residentDeclaration: false,
        termsAccepted: false,
        privacyPolicyAccepted: false,
        personalDataProcessingAccepted: false,
      },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    label: typeof raw.label === 'string' ? raw.label : formatResidentLabel({ fullName, pesel }),
  };
}

function mapResidentAccountsFromUserDoc(data: DocumentData | ResidentHouseholdData | null | undefined): ResidentAccount[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const accounts = Array.isArray(data.residentAccounts) ? data.residentAccounts : [];
  const mapped = accounts.map((account) => mapResidentAccount(account)).filter(Boolean) as ResidentAccount[];

  if (mapped.length > 0) {
    return mapped;
  }

  const fallback = mapResidentAccount({
    id: typeof data.activeResidentAccountId === 'string' ? data.activeResidentAccountId : data.pesel,
    pesel: typeof data.pesel === 'string' ? data.pesel : '',
    firstName: typeof data.firstName === 'string' ? data.firstName : '',
    lastName: typeof data.lastName === 'string' ? data.lastName : '',
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    email: typeof data.email === 'string' ? data.email : '',
    phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : '',
    phoneVerified: data.phoneVerified === true,
    emailVerified: data.emailVerified === true,
    address: data.address,
    commune: typeof data.commune === 'string' ? data.commune : COMMUNE_NAME,
    county: typeof data.county === 'string' ? data.county : COUNTY_NAME,
    consents: data.consents,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });

  return fallback ? [fallback] : [];
}

async function getUserSnapshotByUid(dbInstance: Firestore, uid: string): Promise<ResidentHouseholdData | null> {
  const snapshot = await getDoc(doc(dbInstance, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as ResidentHouseholdData;
}

async function resolveHouseholdByPhone(
  dbInstance: Firestore,
  normalizedPhoneNumber: string
): Promise<{ uid: string; data: ResidentHouseholdData | null; residentAccounts: ResidentAccount[] }> {
  const phoneIndexSnapshot = await getDoc(phoneIndexRef(dbInstance, normalizedPhoneNumber));
  const phoneIndexData = phoneIndexSnapshot.data() as Record<string, unknown> | undefined;
  const indexedUid =
    typeof phoneIndexData?.uid === 'string'
      ? phoneIndexData.uid
      : Array.isArray(phoneIndexData?.uids)
        ? (phoneIndexData?.uids as unknown[]).find((value) => typeof value === 'string') ?? null
        : null;

  if (typeof indexedUid === 'string') {
    const data = await getUserSnapshotByUid(dbInstance, indexedUid);
    return {
      uid: indexedUid,
      data,
      residentAccounts: mapResidentAccountsFromUserDoc(data),
    };
  }

  const usersSnapshot = await getDocs(
    query(collection(dbInstance, 'users'), where('phoneNumber', '==', normalizedPhoneNumber), limit(1))
  );
  const docSnapshot = usersSnapshot.docs[0];

  if (!docSnapshot) {
    return { uid: '', data: null, residentAccounts: [] };
  }

  const data = docSnapshot.data() as ResidentHouseholdData;
  return {
    uid: docSnapshot.id,
    data,
    residentAccounts: mapResidentAccountsFromUserDoc(data),
  };
}

async function resolveHouseholdByPesel(
  dbInstance: Firestore,
  normalizedPesel: string
): Promise<{ uid: string; data: ResidentHouseholdData | null; residentAccounts: ResidentAccount[]; account: ResidentAccount | null }> {
  const peselIndexSnapshot = await getDoc(peselIndexRef(dbInstance, normalizedPesel));
  const peselIndexData = peselIndexSnapshot.data() as Record<string, unknown> | undefined;
  const indexedUid = typeof peselIndexData?.uid === 'string' ? peselIndexData.uid : null;

  if (indexedUid) {
    const data = await getUserSnapshotByUid(dbInstance, indexedUid);
    const residentAccounts = mapResidentAccountsFromUserDoc(data);
    const account =
      residentAccounts.find((item) => item.pesel === normalizedPesel) ??
      (typeof peselIndexData?.residentAccountId === 'string'
        ? residentAccounts.find((item) => item.id === peselIndexData.residentAccountId) ?? null
        : null);

    return { uid: indexedUid, data, residentAccounts, account };
  }

  const usersSnapshot = await getDocs(query(collection(dbInstance, 'users'), where('pesel', '==', normalizedPesel), limit(1)));
  const docSnapshot = usersSnapshot.docs[0];

  if (!docSnapshot) {
    return { uid: '', data: null, residentAccounts: [], account: null };
  }

  const data = docSnapshot.data() as ResidentHouseholdData;
  const residentAccounts = mapResidentAccountsFromUserDoc(data);
  return {
    uid: docSnapshot.id,
    data,
    residentAccounts,
    account: residentAccounts.find((item) => item.pesel === normalizedPesel) ?? residentAccounts[0] ?? null,
  };
}

function getAccountCount(data: ResidentHouseholdData | null, phoneCountFallback = 0): number {
  if (!data) {
    return phoneCountFallback;
  }

  const residentAccounts = mapResidentAccountsFromUserDoc(data);
  if (residentAccounts.length > 0) {
    return residentAccounts.length;
  }

  return phoneCountFallback > 0 ? phoneCountFallback : 1;
}

async function getNativePhoneAuthFactory(): Promise<any> {
  if (!functions) {
    throw new Error('Firebase Functions not initialized');
  }

  const createResidentPhoneVerificationCode = httpsCallable(
    functions,
    'createResidentPhoneVerificationCode'
  );

  return { createResidentPhoneVerificationCode };
}

function isNativeCloudVerificationId(verificationId: string): boolean {
  return verificationId.startsWith('verify_');
}

async function verifyNativePhoneCode(
  verificationId: string,
  smsCode: string,
  normalizedPhoneNumber: string
): Promise<void> {
  if (!functions) {
    throw new Error('Usluga weryfikacji SMS jest niedostepna. Sprobuj ponownie pozniej.');
  }

  await ensureAnonymousAuth();
  try {
    const verifyResidentPhoneCode = httpsCallable<
      { verificationId: string; code: string },
      { success: boolean; phoneNumber?: string }
    >(functions, 'verifyResidentPhoneCode');
    const result = await verifyResidentPhoneCode({
      verificationId,
      code: smsCode.trim(),
    });

    if (!result.data?.success) {
      throw new Error('Nie udalo sie potwierdzic kodu SMS.');
    }

    if (typeof result.data.phoneNumber === 'string') {
      const verifiedPhoneNumber = normalizePhoneNumber(result.data.phoneNumber);
      if (verifiedPhoneNumber !== normalizedPhoneNumber) {
        throw new Error('Kod SMS nie pasuje do podanego numeru telefonu.');
      }
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (error.code === 'functions/not-found') {
        throw new Error('Usluga weryfikacji SMS nie jest dostepna. Skontaktuj sie z administratorem.');
      }

      if (error.code === 'functions/unauthenticated') {
        throw new Error('Sesja logowania SMS nie jest gotowa. Sprobuj ponownie za chwile.');
      }

      if (error.code === 'functions/invalid-argument') {
        throw new Error('Nieprawidlowy kod SMS lub kod wygasl.');
      }

      if (error.code === 'functions/resource-exhausted') {
        throw new Error('Przekroczono limit prob. Sprobuj ponownie za kilka minut.');
      }
    }

    throw error;
  }
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

function getOrCreateRecaptchaVerifier(authInstance: Auth): RecaptchaVerifier {
  if (typeof document === 'undefined') {
    throw new Error('Weryfikacja SMS wymaga uruchomienia aplikacji w przeglądarce.');
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  const containerId = 'resident-phone-recaptcha';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1px';
    container.style.height = '1px';
    document.body.appendChild(container);
  }

  recaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, { size: 'invisible' });
  return recaptchaVerifier;
}

async function signInOrCreateEmailPasswordAccount(email: string, password: string): Promise<User> {
  const authInstance = requireAuth();

  try {
    const credentials = await createUserWithEmailAndPassword(authInstance, email.trim(), password);
    await ensureUserToken(credentials.user);
    return credentials.user;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
      const credentials = await signInWithEmailAndPassword(authInstance, email.trim(), password);
      await ensureUserToken(credentials.user);
      return credentials.user;
    }

    throw error;
  }
}

async function linkPhoneCredentialIfNeeded(user: User, phoneCredential: PhoneAuthCredential) {
  const alreadyLinked = user.providerData.some((provider) => provider.providerId === 'phone');

  if (alreadyLinked) {
    await ensureUserToken(user);
    return user;
  }

  try {
    const linked = await linkWithCredential(user, phoneCredential);
    await ensureUserToken(linked.user);
    return linked.user;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/provider-already-linked') {
      await ensureUserToken(user);
      return user;
    }

    throw error;
  }
}

export async function ensureAnonymousAuth(): Promise<User> {
  const authInstance = requireAuth();

  if (authInstance.currentUser) {
    return authInstance.currentUser;
  }

  try {
    const credentials = await signInAnonymously(authInstance);
    await credentials.user.getIdToken();
    return credentials.user;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/admin-restricted-operation') {
      throw new Error(
        'Firebase Anonymous Auth is disabled. Enable it in Firebase Console -> Authentication -> Sign-in method -> Anonymous.'
      );
    }

    throw error;
  }
}

export async function logoutResidentSession(): Promise<void> {
  const authInstance = requireAuth();
  await signOut(authInstance);
}

export async function loginWithEmailPassword(payload: EmailPasswordLoginPayload): Promise<User> {
  const authInstance = requireAuth();
  const credentials = await signInWithEmailAndPassword(authInstance, payload.email.trim(), payload.password);
  return credentials.user;
}

export async function resolveResidentLoginTarget(identifier: string): Promise<ResidentLoginTarget> {
  await ensureAnonymousAuth();
  const dbInstance = requireDb();
  const rawIdentifier = identifier.trim();

  if (/^\d{11}$/.test(normalizePesel(rawIdentifier))) {
    const resolution = await resolveHouseholdByPesel(dbInstance, normalizePesel(rawIdentifier));

    if (!resolution.data) {
      throw new Error('Nie znaleziono konta dla podanego PESEL.');
    }

    if (!resolution.data.email) {
      throw new Error('To konto nie ma przypisanego adresu e-mail.');
    }

    return {
      uid: resolution.uid,
      email: resolution.data.email,
      phoneNumber: resolution.data.phoneNumber,
      residentAccounts: resolution.residentAccounts,
      matchedResidentAccount: resolution.account,
      requiresSelection: false,
    };
  }

  const normalizedPhoneNumber = normalizePhoneNumber(rawIdentifier);
  const resolution = await resolveHouseholdByPhone(dbInstance, normalizedPhoneNumber);

  if (!resolution.data) {
    throw new Error('Nie znaleziono konta dla podanego numeru telefonu.');
  }

  if (!resolution.data.email) {
    throw new Error('To konto nie ma przypisanego adresu e-mail.');
  }

  return {
    uid: resolution.uid,
    email: resolution.data.email,
    phoneNumber: resolution.data.phoneNumber,
    residentAccounts: resolution.residentAccounts,
    matchedResidentAccount: resolution.residentAccounts[0] ?? null,
    requiresSelection: resolution.residentAccounts.length > 1,
  };
}

export async function checkResidentRegistrationAvailability(
  payload: ResidentRegistrationAvailabilityPayload
): Promise<ResidentRegistrationAvailabilityResult> {
  await ensureAnonymousAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const normalizedPesel = normalizePesel(payload.pesel);

  const [phoneResolution, peselResolution] = await Promise.all([
    resolveHouseholdByPhone(dbInstance, normalizedPhoneNumber),
    resolveHouseholdByPesel(dbInstance, normalizedPesel),
  ]);

  const phoneAccountsCount = getAccountCount(phoneResolution.data, phoneResolution.residentAccounts.length);

  return {
    phoneRegistered: Boolean(phoneResolution.data),
    peselTaken: Boolean(peselResolution.data && peselResolution.uid),
    phoneAccountsCount,
    phoneLimitReached: phoneAccountsCount >= MAX_PHONE_ACCOUNTS,
  };
}

export async function checkPhoneRegistrationLimit(phoneNumber: string): Promise<{
  accountCount: number;
  limitReached: boolean;
  maxAccounts: number;
}> {
  await ensureAnonymousAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const resolution = await resolveHouseholdByPhone(dbInstance, normalizedPhoneNumber);
  const phoneAccountCount = getAccountCount(resolution.data, resolution.residentAccounts.length);

  return {
    accountCount: phoneAccountCount,
    limitReached: phoneAccountCount >= MAX_PHONE_ACCOUNTS,
    maxAccounts: MAX_PHONE_ACCOUNTS,
  };
}

export async function getResidentAccountsForSignedInUser(): Promise<ResidentAccount[]> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();

  if (!authInstance.currentUser || authInstance.currentUser.isAnonymous) {
    return [];
  }

  const userSnapshot = await getDoc(doc(dbInstance, 'users', authInstance.currentUser.uid));
  if (!userSnapshot.exists()) {
    return [];
  }

  return mapResidentAccountsFromUserDoc(userSnapshot.data() as DocumentData);
}

export async function getResidentAccountsByPhoneNumber(phoneNumber: string): Promise<ResidentAccount[]> {
  await ensureAnonymousAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const resolution = await resolveHouseholdByPhone(dbInstance, normalizedPhoneNumber);

  return resolution.residentAccounts;
}

export async function sendResidentPhoneVerificationCode(
  payload: ResidentPhoneVerificationPayload
): Promise<ResidentPhoneVerificationResult> {
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const authInstance = requireAuth();

  console.log('[SMS] sendResidentPhoneVerificationCode START', {
    phoneNumber: '***',
    normalizedPhoneNumber: normalizedPhoneNumber.replace(/\d(?=\d{2})/g, '*'),
    platform: Platform.OS,
    projectId: authInstance?.app?.options?.projectId,
    currentUser: authInstance?.currentUser ? { uid: authInstance.currentUser.uid, isAnonymous: authInstance.currentUser.isAnonymous } : null,
  });

  if (isDevBypassPhone(normalizedPhoneNumber)) {
    console.log('[SMS] Using dev bypass for SMS verification');
    return {
      verificationId: DEV_BYPASS_VERIFICATION_ID,
      normalizedPhoneNumber,
      expiresAt: Date.now() + SMS_RATE_LIMIT.SMS_CODE_EXPIRY_MS,
    };
  }

  const dbInstance = requireDb();

  try {
    await ensureAnonymousAuth();
    console.log('[SMS] Anonymous auth ensured');

    // Check rate limit before sending SMS
    const rateLimitStatus = await checkSmsRateLimit(dbInstance, normalizedPhoneNumber);
    if (!rateLimitStatus.allowed) {
      const reason = rateLimitStatus.reason || 'SMS wysyłanie jest zablokowane.';
      console.log('[SMS] Rate limit check failed', { reason, blockedUntil: rateLimitStatus.blockedUntil });
      throw new Error(reason);
    }

    console.log('[SMS] Rate limit check passed');

    if (Platform.OS !== 'web') {
      // Use Cloud Functions for native platforms
      if (!functions) {
        throw new Error('Firebase Functions not initialized');
      }
      try {
        console.log('[SMS] Calling createResidentPhoneVerificationCode Cloud Function for native platform');
        const createVerification = httpsCallable<
          { phoneNumber: string },
          ResidentPhoneVerificationResult
        >(functions, 'createResidentPhoneVerificationCode');
        const result = await createVerification({ phoneNumber: normalizedPhoneNumber });
        console.log('[SMS] Cloud Function succeeded, verification ID:', result.data.verificationId);
        return result.data;
      } catch (error) {
        console.error('[SMS] Cloud Function error:', error);
        if (error instanceof FirebaseError) {
          if (error.code === 'functions/not-found') {
            throw new Error(
              'Usługa logowania SMS nie jest dostępna (brak funkcji backend). Skontaktuj się z administratorem.'
            );
          }

          if (error.code === 'functions/invalid-argument') {
            throw new Error('Numer telefonu ma nieprawidłowy format.');
          }

          if (error.code === 'functions/resource-exhausted') {
            throw new Error('Przekroczono limit wysyłek SMS. Spróbuj ponownie później.');
          }

          if (error.code === 'functions/unauthenticated') {
            throw new Error('Sesja logowania SMS nie jest gotowa. Spróbuj ponownie za chwilę.');
          }

          if (error.code === 'functions/internal') {
            throw new Error('Błąd serwera podczas wysyłania SMS. Spróbuj ponownie później.');
          }

          console.error('[SMS] Firebase error code:', error.code, 'message:', error.message);
        }

        throw error;
      }
    }

    console.log('[SMS] Using Firebase Phone Auth with reCAPTCHA for web');
    const verifier = getOrCreateRecaptchaVerifier(authInstance);
    const confirmationResult = await signInWithPhoneNumber(authInstance, normalizedPhoneNumber, verifier);

    console.log('[SMS] Phone Auth SMS sent successfully, verification ID:', confirmationResult.verificationId);

    return {
      verificationId: confirmationResult.verificationId,
      normalizedPhoneNumber,
      expiresAt: Date.now() + SMS_RATE_LIMIT.SMS_CODE_EXPIRY_MS,
    };
  } catch (error) {
    console.error('[SMS] sendResidentPhoneVerificationCode ERROR', {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof FirebaseError ? error.code : 'unknown',
    });
    throw error;
  }
}

export async function completeResidentRegistration(
  payload: ResidentRegistrationFormValues,
  verificationId: string,
  smsCode: string
): Promise<User> {
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const normalizedPesel = normalizePesel(payload.pesel);
  const isDevBypass = isDevBypassVerification(verificationId, normalizedPhoneNumber);
  const normalizedSmsCode = smsCode.trim();

  console.log('[SMS] completeResidentRegistration START', {
    phoneNumber: '***',
    normalizedPhoneNumber: normalizedPhoneNumber.replace(/\d(?=\d{2})/g, '*'),
    pesel: '***',
    isDevBypass,
    codeLength: normalizedSmsCode.length,
    platform: Platform.OS,
  });

  if (!isValidSmsCodeShape(normalizedSmsCode) && !isDevBypass) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  if (isDevBypass && normalizedSmsCode !== DEV_BYPASS_CODE) {
    throw new Error('W trybie testowym wpisz kod 123456.');
  }

  try {
    const signedInUser = await signInOrCreateEmailPasswordAccount(payload.email, payload.password);
    console.log('[SMS] Email/password account ready', { uid: signedInUser.uid });

    const usesNativeCloudVerification = Platform.OS !== 'web' && !isDevBypass && isNativeCloudVerificationId(verificationId);
    const canLinkPhoneCredential = !isDevBypass;

    console.log('[SMS] Phone verification strategy', { usesNativeCloudVerification, canLinkPhoneCredential });

    if (usesNativeCloudVerification) {
      await verifyNativePhoneCode(verificationId, smsCode, normalizedPhoneNumber);
    } else if (canLinkPhoneCredential) {
      const phoneCredential = PhoneAuthProvider.credential(verificationId, normalizedSmsCode);
      await linkPhoneCredentialIfNeeded(signedInUser, phoneCredential);
    }

    console.log('[SMS] Phone credential verified');

    await ensureUserToken(signedInUser);

    const residentAccount: ResidentAccount = {
    id: normalizedPesel,
    pesel: normalizedPesel,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    fullName: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
    email: payload.email.trim(),
    phoneNumber: normalizedPhoneNumber,
    phoneVerified: true,
    emailVerified: signedInUser.emailVerified,
    address: {
      street: payload.address.street.trim(),
      houseNumber: payload.address.houseNumber.trim(),
      apartmentNumber:
        payload.address.apartmentNumber && payload.address.apartmentNumber.trim().length > 0
          ? payload.address.apartmentNumber.trim()
          : null,
      postalCode: payload.address.postalCode.trim(),
      city: payload.address.city.trim(),
      commune: payload.address.commune.trim() || COMMUNE_NAME,
    },
    commune: payload.address.commune.trim() || COMMUNE_NAME,
    county: COUNTY_NAME,
    residentStatus: 'verified_resident',
    consents: {
      residentDeclaration: payload.residentDeclaration,
      termsAccepted: payload.termsAccepted,
      privacyPolicyAccepted: payload.privacyPolicyAccepted,
      personalDataProcessingAccepted: payload.personalDataProcessingAccepted,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    label: formatResidentLabel({
      fullName: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
      pesel: normalizedPesel,
    }),
    };

    await runTransaction(dbInstance, async (transaction) => {
    const userRef = doc(dbInstance, 'users', signedInUser.uid);
    const phoneIndexRefCurrent = phoneIndexRef(dbInstance, normalizedPhoneNumber);
    const peselIndexRefCurrent = peselIndexRef(dbInstance, normalizedPesel);

    const [userSnapshot, phoneIndexSnapshot, peselIndexSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(phoneIndexRefCurrent),
      transaction.get(peselIndexRefCurrent),
    ]);

    const userData = userSnapshot.data() as DocumentData | undefined;
    const currentAccounts = mapResidentAccountsFromUserDoc(userData);
    const phoneIndexData = phoneIndexSnapshot.data() as Record<string, unknown> | undefined;
    const nextAccounts = currentAccounts.some((account) => account.id === normalizedPesel)
      ? currentAccounts.map((account) => (account.id === normalizedPesel ? { ...account, ...residentAccount } : account))
      : [...currentAccounts, residentAccount];

    if (nextAccounts.length > MAX_PHONE_ACCOUNTS) {
      throw new Error('Na ten numer telefonu utworzono już maksymalną liczbę kont.');
    }

    if (peselIndexSnapshot.exists()) {
      const peselIndexData = peselIndexSnapshot.data() as Record<string, unknown>;
      if (typeof peselIndexData.uid === 'string' && peselIndexData.uid !== signedInUser.uid) {
        throw new Error('To konto mieszkańca zostało już zarejestrowane.');
      }
    }

    transaction.set(
      userRef,
      {
        uid: signedInUser.uid,
        firstName: residentAccount.firstName,
        lastName: residentAccount.lastName,
        fullName: residentAccount.fullName,
        email: residentAccount.email,
        phoneNumber: residentAccount.phoneNumber,
        pesel: residentAccount.pesel,
        address: residentAccount.address,
        commune: residentAccount.commune,
        county: residentAccount.county,
        residentStatus: residentAccount.residentStatus,
        phoneVerified: true,
        emailVerified: signedInUser.emailVerified,
        consents: residentAccount.consents,
        residentAccounts: nextAccounts,
        activeResidentAccountId: normalizedPesel,
        createdAt: userSnapshot.exists() ? userData?.createdAt ?? serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      phoneIndexRefCurrent,
      {
        normalizedPhoneNumber,
        uid: signedInUser.uid,
        uids: [signedInUser.uid],
        residentAccountIds: nextAccounts.map((account) => account.id),
        accountCount: nextAccounts.length,
        createdAt: phoneIndexSnapshot.exists() ? phoneIndexData?.createdAt ?? serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      peselIndexRefCurrent,
      {
        pesel: normalizedPesel,
        uid: signedInUser.uid,
        residentAccountId: normalizedPesel,
        createdAt: peselIndexSnapshot.exists()
          ? (peselIndexSnapshot.data() as Record<string, unknown>)?.createdAt ?? serverTimestamp()
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

    console.log('[SMS] Registration completed successfully', {
      uid: signedInUser.uid,
      phoneNumber: '***',
      pesel: '***',
    });

    return signedInUser;
  } catch (error) {
    console.error('[SMS] completeResidentRegistration ERROR', {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof FirebaseError ? error.code : 'unknown',
      step: 'completeResidentRegistration',
    });
    throw error;
  }
}

export async function confirmResidentPhoneVerificationCode(
  payload: ConfirmResidentPhoneVerificationPayload
): Promise<User> {
  const authInstance = requireAuth();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const isDevBypass = isDevBypassVerification(payload.verificationId, normalizedPhoneNumber);
  const normalizedSmsCode = payload.smsCode.trim();

  console.log('[SMS] confirmResidentPhoneVerificationCode START', {
    phoneNumber: '***',
    normalizedPhoneNumber: normalizedPhoneNumber.replace(/\d(?=\d{2})/g, '*'),
    isDevBypass,
    codeLength: normalizedSmsCode.length,
  });

  if (isDevBypass && !isValidSmsCodeShape(normalizedSmsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  if (isDevBypass && normalizedSmsCode !== DEV_BYPASS_CODE) {
    throw new Error('W trybie testowym wpisz kod 123456.');
  }

  if (!isValidSmsCodeShape(normalizedSmsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  try {
    if (Platform.OS !== 'web' && !isDevBypass) {
      await getNativePhoneAuthFactory();
    }

    const credential = PhoneAuthProvider.credential(payload.verificationId, normalizedSmsCode);
    const signedInUser = isDevBypass
      ? await ensureAnonymousAuth()
      : (await signInWithCredential(authInstance, credential)).user;

    console.log('[SMS] Phone credential verified', { uid: signedInUser.uid });

    await ensureUserToken(signedInUser);

    return signedInUser;
  } catch (error) {
    console.error('[SMS] confirmResidentPhoneVerificationCode ERROR', {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof FirebaseError ? error.code : 'unknown',
    });
    throw error;
  }
}

export async function confirmResidentPhoneLoginCode(
  payload: ConfirmResidentPhoneVerificationPayload
): Promise<User> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const smsCode = payload.smsCode.trim();
  const isDevBypass = isDevBypassVerification(payload.verificationId, normalizedPhoneNumber);

  console.log('[SMS] confirmResidentPhoneLoginCode START', {
    phoneNumber: '***',
    normalizedPhoneNumber: normalizedPhoneNumber.replace(/\d(?=\d{2})/g, '*'),
    isDevBypass,
    codeLength: smsCode.length,
    platform: Platform.OS,
  });

  if (isDevBypass && !isValidSmsCodeShape(smsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  if (!isDevBypass && !isValidSmsCodeShape(smsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  if (isDevBypass && smsCode !== DEV_BYPASS_CODE) {
    throw new Error('W trybie testowym wpisz kod 123456.');
  }

  try {
    if (!isDevBypass && Platform.OS !== 'web') {
      await getNativePhoneAuthFactory();
    }

    if (!functions) {
      throw new Error('Firebase Functions not initialized');
    }

    console.log('[SMS] Calling verifyResidentPhoneCode Cloud Function');
    const createVerification = httpsCallable<
      { verificationId: string; code: string; phoneNumber: string },
      { success: boolean; phoneNumber?: string; customToken?: string; uid?: string }
    >(functions, 'verifyResidentPhoneCode');

    const result = await createVerification({
      verificationId: payload.verificationId,
      code: smsCode,
      phoneNumber: normalizedPhoneNumber,
    });

    console.log('[SMS] Cloud Function returned', { success: result.data.success, hasCustomToken: !!result.data.customToken });

    if (!result.data.customToken) {
      throw new Error('Nie znaleziono powiązanego konta mieszkańca dla tego numeru telefonu.');
    }

    const credentials = await signInWithCustomToken(authInstance, result.data.customToken);
    const signedInUser = credentials.user;

    if (!signedInUser) {
      throw new Error('Nie udało się potwierdzić kodu SMS.');
    }

    console.log('[SMS] Login via custom token succeeded', { uid: signedInUser.uid });

    await ensureUserToken(signedInUser);

    const userSnapshot = await getDoc(doc(dbInstance, 'users', signedInUser.uid));
    if (!userSnapshot.exists()) {
      await signOut(authInstance);
      throw new Error('Nie znaleziono konta mieszkanca dla tego numeru telefonu.');
    }

    const userData = userSnapshot.data() as ResidentHouseholdData;
    const hasMatchingPhone =
      normalizePhoneNumber(userData.phoneNumber) === normalizedPhoneNumber ||
      normalizePhoneNumber(userData.phoneNumber) === normalizedPhoneNumber;

    if (!hasMatchingPhone) {
      await signOut(authInstance);
      throw new Error('Konto nie jest powiązane z tym numerem telefonu.');
    }

    console.log('[SMS] Phone login verification complete');
    return signedInUser;
  } catch (error) {
    console.error('[SMS] confirmResidentPhoneLoginCode ERROR', {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof FirebaseError ? error.code : 'unknown',
    });
    throw error;
  }
}

export async function sendResidentPasswordReset(payload: PasswordResetRequest): Promise<void> {
  await ensureAnonymousAuth();
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const identifier = payload.identifier.trim();

  if (/^\S+@\S+\.\S+$/.test(identifier)) {
    await sendPasswordResetEmail(authInstance, identifier);
    return;
  }

  if (/^\d{11}$/.test(normalizePesel(identifier))) {
    const resolution = await resolveHouseholdByPesel(dbInstance, normalizePesel(identifier));
    if (!resolution.data?.email) {
      throw new Error('Nie znaleziono adresu e-mail dla podanego PESEL.');
    }

    await sendPasswordResetEmail(authInstance, resolution.data.email);
    return;
  }

  const resolution = await resolveHouseholdByPhone(dbInstance, normalizePhoneNumber(identifier));
  if (!resolution.data?.email) {
    throw new Error('Nie znaleziono adresu e-mail dla podanego numeru telefonu.');
  }

  await sendPasswordResetEmail(authInstance, resolution.data.email);
}

export async function register(payload: RegisterPayload): Promise<User> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const credentials = await createUserWithEmailAndPassword(authInstance, payload.email, payload.password);

  await setDoc(
    doc(dbInstance, 'users', credentials.user.uid),
    {
      uid: credentials.user.uid,
      firstName: payload.firstName,
      lastName: payload.lastName,
      fullName: `${payload.firstName} ${payload.lastName}`.trim(),
      email: payload.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return credentials.user;
}

async function checkSmsRateLimit(
  dbInstance: Firestore,
  normalizedPhoneNumber: string
): Promise<SmsRateLimitStatus> {
  if (__DEV__ && normalizedPhoneNumber === DEV_BYPASS_PHONE) {
    return { allowed: true };
  }

  const now = Date.now();
  const rateLimitRef = doc(dbInstance, 'sms_rate_limits', normalizedPhoneNumber);
  const rateLimitSnapshot = await getDoc(rateLimitRef);
  const rateLimitData = rateLimitSnapshot.data() as Record<string, unknown> | undefined;

  if (rateLimitData) {
    const blockedUntil = typeof rateLimitData.blockedUntil === 'number' ? rateLimitData.blockedUntil : 0;
    if (blockedUntil > now) {
      return {
        allowed: false,
        reason: 'SMS wysyłanie jest tymczasowo zablokowane. Spróbuj za kilka minut.',
        blockedUntil,
      };
    }

    const dayResets = typeof rateLimitData.dayResets === 'number' ? rateLimitData.dayResets : now;
    const isDayExpired = now - dayResets > 24 * 60 * 60 * 1000;

    const smtCount5Min = typeof rateLimitData.smsCount5Min === 'number' ? rateLimitData.smsCount5Min : 0;
    const smsCountDay = typeof rateLimitData.smsCountDay === 'number' ? rateLimitData.smsCountDay : 0;
    const lastSmsTime = typeof rateLimitData.lastSmsTime === 'number' ? rateLimitData.lastSmsTime : 0;

    const isSms5MinExpired = now - lastSmsTime > 5 * 60 * 1000;

    const nextCount5Min = isSms5MinExpired ? 1 : smtCount5Min + 1;
    const nextCountDay = isDayExpired ? 1 : smsCountDay + 1;

    if (nextCount5Min > SMS_RATE_LIMIT.MAX_SMS_PER_5_MIN) {
      const blockedMS = SMS_RATE_LIMIT.BLOCK_DURATION_MS;
      await setDoc(
        rateLimitRef,
        {
          blockedUntil: now + blockedMS,
          lastSmsTime: now,
          smsCount5Min: nextCount5Min,
          smsCountDay: nextCountDay,
          dayResets: isDayExpired ? now : dayResets,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        allowed: false,
        reason: 'Zbyt wiele wysyłek SMS. Spróbuj za godzinę.',
        blockedUntil: now + blockedMS,
      };
    }

    if (nextCountDay > SMS_RATE_LIMIT.MAX_SMS_PER_DAY) {
      const blockedMS = SMS_RATE_LIMIT.BLOCK_DURATION_MS;
      await setDoc(
        rateLimitRef,
        {
          blockedUntil: now + blockedMS,
          lastSmsTime: now,
          smsCount5Min: nextCount5Min,
          smsCountDay: nextCountDay,
          dayResets: isDayExpired ? now : dayResets,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        allowed: false,
        reason: `Dzienna limit SMS. Możliwe maksymalnie ${SMS_RATE_LIMIT.MAX_SMS_PER_DAY} wysyłek dziennie.`,
      };
    }

    await setDoc(
      rateLimitRef,
      {
        lastSmsTime: now,
        smsCount5Min: nextCount5Min,
        smsCountDay: nextCountDay,
        dayResets: isDayExpired ? now : dayResets,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { allowed: true };
  }

  await setDoc(rateLimitRef, {
    lastSmsTime: now,
    smsCount5Min: 1,
    smsCountDay: 1,
    dayResets: now,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { allowed: true };
}

export { fetchSignInMethodsForEmail };
