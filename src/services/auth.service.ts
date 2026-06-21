import {
  COMMUNE_NAME,
  COUNTY_NAME,
  normalizePeselInput,
  normalizePhoneInput,
  type ResidentRegistrationFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { auth, createCallable, db } from '@/src/lib/firebase';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

const MAX_PHONE_ACCOUNTS = 5;
const GENERIC_LOGIN_ERROR = 'Nieprawidłowy email/numer telefonu lub hasło.';
const INVALID_LOGIN_ATTEMPT_EMAIL = 'invalid-login@powiat-decyduje.invalid';
const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Ten adres e-mail jest już używany.',
  'auth/invalid-email': 'Wpisz poprawny adres e-mail.',
  'auth/user-not-found': 'Nie znaleziono konta dla podanego adresu e-mail.',
  'auth/wrong-password': 'Nieprawidłowe hasło.',
  'auth/weak-password': 'Hasło jest zbyt słabe. Użyj co najmniej 8 znaków.',
  'functions/not-found': 'Usługa SMS nie jest dostępna. Skontaktuj się z administratorem.',
  'functions/resource-exhausted': 'Przekroczono limit wysyłek lub prób. Spróbuj ponownie później.',
  'functions/invalid-argument': 'Nieprawidłowe dane wejściowe. Sprawdź numer telefonu lub kod.',
  'functions/failed-precondition':
    'Wysyłka SMS nie jest skonfigurowana. Skontaktuj się z administratorem lub użyj trybu emulatora.',
  'functions/already-exists': 'Nie można zarejestrować konta.',
  'functions/permission-denied': 'Brak uprawnień do wykonania operacji.',
  'functions/internal': 'Błąd serwera. Spróbuj ponownie później.',
};

function toFriendlyFirebaseError(error: unknown): Error | null {
  if (!(error instanceof FirebaseError)) {
    return null;
  }

  const message = firebaseErrorMessages[error.code];
  return message ? new Error(message) : null;
}

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

export type IdentifierLoginPayload = {
  identifier: string;
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

export type RegistrationSmsResult = {
  verificationId: string;
  normalizedPhoneNumber: string;
  expiresAt: number;
};

export type VerifyRegistrationSmsPayload = {
  verificationId: string;
  smsCode: string;
  phoneNumber: string;
};

export type RegistrationSmsRequest = {
  phoneNumber: string;
};

export type PasswordResetSmsRequest = {
  phoneNumber: string;
};

export type PasswordResetSmsVerificationPayload = {
  verificationId: string;
  smsCode: string;
};

export type PasswordResetWithSmsPayload = {
  verificationId: string;
  smsCode: string;
  newPassword: string;
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

function isValidSmsCodeShape(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

async function ensureUserToken(user: User): Promise<void> {
  await user.getIdToken(true);
}

async function createEmailPasswordAccount(email: string, password: string): Promise<User> {
  const authInstance = requireAuth();
  const normalizedEmail = email.trim();

  if (authInstance.currentUser?.isAnonymous) {
    const credential = EmailAuthProvider.credential(normalizedEmail, password);
    const linkedCredentials = await linkWithCredential(authInstance.currentUser, credential);
    await ensureUserToken(linkedCredentials.user);
    return linkedCredentials.user;
  }

  const credentials = await createUserWithEmailAndPassword(authInstance, normalizedEmail, password);
  await ensureUserToken(credentials.user);
  return credentials.user;
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


export async function ensureAnonymousAuth(): Promise<User> {
  const authInstance = requireAuth();

  if (authInstance.currentUser) {
    // Ensure we have a fresh token
    await authInstance.currentUser.getIdToken(true);
    return authInstance.currentUser;
  }

  try {
    const credentials = await signInAnonymously(authInstance);
    // Force refresh to get a fresh token and ensure it's propagated
    await credentials.user.getIdToken(true);
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

export async function loginWithIdentifier(payload: IdentifierLoginPayload): Promise<User> {
  const authInstance = requireAuth();
  const identifier = payload.identifier.trim();
  const password = payload.password;
  let candidateEmails: string[] = [];

  if (identifier.includes('@')) {
    candidateEmails = [identifier];
  } else {
    try {
      const resolveLogin = createCallable<{ identifier: string }, { emails: string[] }>(
        'resolveLoginIdentifier'
      );
      const { data } = await resolveLogin({ identifier });
      candidateEmails = Array.isArray(data.emails) ? data.emails : [];
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'functions/not-found') {
        throw new Error('Usługa logowania jest chwilowo niedostępna. Spróbuj ponownie później.');
      }
      candidateEmails = [];
    }
  }

  if (candidateEmails.length === 0) {
    candidateEmails = [INVALID_LOGIN_ATTEMPT_EMAIL];
  }

  for (const email of candidateEmails) {
    try {
      const credentials = await signInWithEmailAndPassword(authInstance, email.trim(), password);
      return credentials.user;
    } catch {
      // Try the next candidate without revealing which identifier exists.
    }
  }

  throw new Error(GENERIC_LOGIN_ERROR);
}

export async function loginWithEmailPassword(payload: EmailPasswordLoginPayload): Promise<User> {
  return loginWithIdentifier({
    identifier: payload.email,
    password: payload.password,
  });
}

export async function checkResidentRegistrationAvailability(
  payload: ResidentRegistrationAvailabilityPayload
): Promise<ResidentRegistrationAvailabilityResult> {
  try {
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
      peselTaken: Boolean(peselResolution.account),
      phoneAccountsCount,
      phoneLimitReached: phoneAccountsCount >= MAX_PHONE_ACCOUNTS,
    };
  } catch (error) {
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
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
  const profile = await getSignedInUserResidentProfile();
  return profile.accounts;
}

export type SignedInUserResidentProfile = {
  accounts: ResidentAccount[];
  activeResidentAccountId: string | null;
};

export async function getSignedInUserResidentProfile(): Promise<SignedInUserResidentProfile> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();

  if (!authInstance.currentUser || authInstance.currentUser.isAnonymous) {
    return { accounts: [], activeResidentAccountId: null };
  }

  const userSnapshot = await getDoc(doc(dbInstance, 'users', authInstance.currentUser.uid));
  if (!userSnapshot.exists()) {
    return { accounts: [], activeResidentAccountId: null };
  }

  const data = userSnapshot.data() as DocumentData;
  return {
    accounts: mapResidentAccountsFromUserDoc(data),
    activeResidentAccountId:
      typeof data.activeResidentAccountId === 'string' ? data.activeResidentAccountId : null,
  };
}

export function resolveActiveResidentAccountId(
  accounts: ResidentAccount[],
  preferredIds: (string | null | undefined)[] = []
): string | null {
  if (!accounts.length) {
    return null;
  }

  for (const preferredId of preferredIds) {
    if (preferredId && accounts.some((account) => account.id === preferredId)) {
      return preferredId;
    }
  }

  return accounts[0]?.id ?? null;
}

export async function getResidentAccountsByPhoneNumber(phoneNumber: string): Promise<ResidentAccount[]> {
  await ensureAnonymousAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const resolution = await resolveHouseholdByPhone(dbInstance, normalizedPhoneNumber);

  return resolution.residentAccounts;
}

export async function sendRegistrationSmsCode(
  payload: RegistrationSmsRequest
): Promise<RegistrationSmsResult> {
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);

  try {
    const createVerification = createCallable<{ phoneNumber: string }, RegistrationSmsResult>(
      'sendRegistrationSmsCode'
    );

    const { data } = await createVerification({ phoneNumber: normalizedPhoneNumber });

    return {
      ...data,
      normalizedPhoneNumber: normalizePhoneNumber(data.normalizedPhoneNumber ?? normalizedPhoneNumber),
    };
  } catch (error) {
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
}

export const sendResidentPhoneVerificationCode = sendRegistrationSmsCode;

export async function verifyRegistrationSmsCode(
  payload: VerifyRegistrationSmsPayload
): Promise<RegistrationSmsResult> {
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const smsCode = payload.smsCode.trim();

  if (!isValidSmsCodeShape(smsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  try {
    const verifyCode = createCallable<{ verificationId: string; code: string }, RegistrationSmsResult>(
      'verifyRegistrationSmsCode'
    );
    const { data } = await verifyCode({
      verificationId: payload.verificationId,
      code: smsCode,
    });

    if (normalizePhoneNumber(data.normalizedPhoneNumber) !== normalizedPhoneNumber) {
      throw new Error('Kod SMS nie pasuje do podanego numeru telefonu.');
    }

    return data;
  } catch (error) {
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
}

export async function registerResidentAccount(
  payload: ResidentRegistrationFormValues,
  verificationId: string
): Promise<User> {
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const normalizedPesel = normalizePesel(payload.pesel);
  let authUserForRollback: User | null = null;
  let linkedAnonymousUser = false;
  let createdNewEmailUser = false;

  try {
    const authInstance = requireAuth();
    const wasAnonymous = authInstance.currentUser?.isAnonymous === true;
    const signedInUser = await createEmailPasswordAccount(payload.email, payload.password);
    authUserForRollback = signedInUser;
    linkedAnonymousUser = wasAnonymous;
    createdNewEmailUser = !wasAnonymous;

    const registerAccount = createCallable<
      {
        verificationId: string;
        phoneNumber: string;
        pesel: string;
        email: string;
        firstName: string;
        lastName: string;
        address: ResidentAddress;
        consents: ResidentConsents;
        county: string;
      },
      { uid: string }
    >('registerResidentAccount');

    await registerAccount({
      verificationId,
      phoneNumber: normalizedPhoneNumber,
      pesel: normalizedPesel,
      email: payload.email.trim(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
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
      consents: {
        residentDeclaration: payload.residentDeclaration,
        termsAccepted: payload.termsAccepted,
        privacyPolicyAccepted: payload.privacyPolicyAccepted,
        personalDataProcessingAccepted: payload.personalDataProcessingAccepted,
      },
      county: COUNTY_NAME,
    });

    return signedInUser;
  } catch (error) {
    if (authUserForRollback && (createdNewEmailUser || linkedAnonymousUser)) {
      try {
        // Roll back a fresh email account or a newly linked anonymous session if Firestore write failed.
        await authUserForRollback.delete();
      } catch {
        // Best-effort rollback; the cloud function also cleans up on failure.
      }
    }
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
}

export async function completeResidentRegistration(
  payload: ResidentRegistrationFormValues,
  verificationId: string,
  smsCode: string
): Promise<User> {
  await verifyRegistrationSmsCode({
    verificationId,
    smsCode,
    phoneNumber: payload.phoneNumber,
  });
  return registerResidentAccount(payload, verificationId);
}

export async function sendPasswordResetSmsCode(
  payload: PasswordResetSmsRequest
): Promise<{ verificationId: string; expiresAt: number }> {
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  try {
    const sendSms = createCallable<{ phoneNumber: string }, { verificationId: string; expiresAt: number }>(
      'sendPasswordResetSmsCode'
    );
    const { data } = await sendSms({ phoneNumber: normalizedPhoneNumber });
    return data;
  } catch (error) {
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
}

export async function verifyPasswordResetSmsCode(
  payload: PasswordResetSmsVerificationPayload
): Promise<{ verificationId: string; expiresAt: number }> {
  const smsCode = payload.smsCode.trim();
  if (!isValidSmsCodeShape(smsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }

  try {
    const verifySms = createCallable<
      { verificationId: string; code: string },
      { verificationId: string; expiresAt: number }
    >('verifyPasswordResetSmsCode');
    const { data } = await verifySms({ verificationId: payload.verificationId, code: smsCode });
    return data;
  } catch (error) {
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
}

export async function resetPasswordWithSmsCode(
  payload: PasswordResetWithSmsPayload
): Promise<void> {
  const smsCode = payload.smsCode.trim();
  if (!isValidSmsCodeShape(smsCode)) {
    throw new Error('Wpisz 6-cyfrowy kod SMS.');
  }
  if (payload.newPassword.trim().length < 8) {
    throw new Error('Haslo musi miec co najmniej 8 znakow.');
  }

  try {
    const resetPassword = createCallable<
      { verificationId: string; code: string; newPassword: string },
      { success: boolean }
    >('resetPasswordWithSmsCode');
    await resetPassword({
      verificationId: payload.verificationId,
      code: smsCode,
      newPassword: payload.newPassword,
    });
  } catch (error) {
    const friendly = toFriendlyFirebaseError(error);
    if (friendly) {
      throw friendly;
    }
    throw error;
  }
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
