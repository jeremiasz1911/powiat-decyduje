import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInAnonymously,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type ConfirmationResult,
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
  type Firestore,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/src/lib/firebase';

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

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type ResidentRegistrationAvailabilityPayload = {
  phoneNumber: string;
  pesel: string;
};

export type ResidentRegistrationAvailabilityResult = {
  phoneTaken: boolean;
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
};

export type ConfirmResidentPhoneVerificationPayload = {
  verificationId: string;
  smsCode: string;
  phoneNumber: string;
  pesel: string;
};

export type ConfirmResidentPhoneLoginPayload = {
  verificationId: string;
  smsCode: string;
  phoneNumber: string;
};

export type PhoneRegistrationLimitResult = {
  accountCount: number;
  limitReached: boolean;
  maxAccounts: number;
};

const MAX_PHONE_ACCOUNTS = 5;

function normalizePhoneNumber(rawPhoneNumber: string): string {
  const compact = rawPhoneNumber.replace(/[\s-]/g, '');

  if (/^\d{9}$/.test(compact)) {
    return `+48${compact}`;
  }

  if (/^48\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  return compact;
}

function normalizePesel(rawPesel: string): string {
  return rawPesel.trim();
}

function phoneIndexRef(dbInstance: Firestore, normalizedPhoneNumber: string) {
  return doc(dbInstance, 'auth_index_phone', normalizedPhoneNumber);
}

function peselIndexRef(dbInstance: Firestore, normalizedPesel: string) {
  return doc(dbInstance, 'auth_index_pesel', normalizedPesel);
}

async function getPhoneAccountUids(
  dbInstance: Firestore,
  normalizedPhoneNumber: string
): Promise<string[]> {
  const usersRef = collection(dbInstance, 'users');
  const [phoneNumberSnapshot, legacyPhoneSnapshot] = await Promise.all([
    getDocs(query(usersRef, where('phoneNumber', '==', normalizedPhoneNumber), limit(MAX_PHONE_ACCOUNTS + 1))),
    getDocs(query(usersRef, where('phone', '==', normalizedPhoneNumber), limit(MAX_PHONE_ACCOUNTS + 1))),
  ]);

  return Array.from(new Set([...phoneNumberSnapshot.docs, ...legacyPhoneSnapshot.docs].map((docSnapshot) => docSnapshot.id)));
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

function getOrCreateRecaptchaVerifier(authInstance: Auth): RecaptchaVerifier {
  if (typeof document === 'undefined') {
    throw new Error('Weryfikacja SMS wymaga uruchomienia aplikacji w przegladarce (web).');
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

export async function ensureAnonymousAuth(): Promise<User> {
  const authInstance = requireAuth();

  if (authInstance.currentUser) {
    return authInstance.currentUser;
  }

  try {
    const credentials = await signInAnonymously(authInstance);
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

export async function register(payload: RegisterPayload): Promise<User> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const credentials = await createUserWithEmailAndPassword(authInstance, payload.email, payload.password);

  await setDoc(doc(dbInstance, 'users', credentials.user.uid), {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    createdAt: serverTimestamp(),
  });

  return credentials.user;
}

export async function checkResidentRegistrationAvailability(
  payload: ResidentRegistrationAvailabilityPayload
): Promise<ResidentRegistrationAvailabilityResult> {
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const normalizedPesel = normalizePesel(payload.pesel);
  const phoneAccountUids = await getPhoneAccountUids(dbInstance, normalizedPhoneNumber);
  const phoneLimitReached = phoneAccountUids.length >= MAX_PHONE_ACCOUNTS;

  const [phoneIndexSnapshot, peselIndexSnapshot] = await Promise.all([
    getDoc(phoneIndexRef(dbInstance, normalizedPhoneNumber)),
    getDoc(peselIndexRef(dbInstance, normalizedPesel)),
  ]);

  if (phoneIndexSnapshot.exists() || peselIndexSnapshot.exists()) {
    return {
      phoneTaken: phoneIndexSnapshot.exists() || phoneAccountUids.length > 0,
      peselTaken: peselIndexSnapshot.exists(),
      phoneAccountsCount: phoneAccountUids.length,
      phoneLimitReached,
    };
  }

  const usersRef = collection(dbInstance, 'users');
  const peselSnapshot = await getDocs(query(usersRef, where('pesel', '==', normalizedPesel), limit(1)));

  return {
    phoneTaken: phoneAccountUids.length > 0,
    peselTaken: !peselSnapshot.empty,
    phoneAccountsCount: phoneAccountUids.length,
    phoneLimitReached,
  };
}

export async function checkPhoneRegistrationLimit(phoneNumber: string): Promise<PhoneRegistrationLimitResult> {
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const phoneAccountUids = await getPhoneAccountUids(dbInstance, normalizedPhoneNumber);

  return {
    accountCount: phoneAccountUids.length,
    limitReached: phoneAccountUids.length >= MAX_PHONE_ACCOUNTS,
    maxAccounts: MAX_PHONE_ACCOUNTS,
  };
}

export async function sendResidentPhoneVerificationCode(
  payload: ResidentPhoneVerificationPayload
): Promise<ResidentPhoneVerificationResult> {
  const authInstance = requireAuth();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const verifier = getOrCreateRecaptchaVerifier(authInstance);
  const confirmationResult: ConfirmationResult = await signInWithPhoneNumber(
    authInstance,
    normalizedPhoneNumber,
    verifier
  );

  return {
    verificationId: confirmationResult.verificationId,
    normalizedPhoneNumber,
  };
}

export async function confirmResidentPhoneVerificationCode(
  payload: ConfirmResidentPhoneVerificationPayload
): Promise<User> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);
  const normalizedPesel = normalizePesel(payload.pesel);

  const credential = PhoneAuthProvider.credential(payload.verificationId, payload.smsCode.trim());
  const credentials = await signInWithCredential(authInstance, credential);
  const signedInUser = credentials.user;
  const phoneAccountUids = await getPhoneAccountUids(dbInstance, normalizedPhoneNumber);
  const alreadyLinkedToCurrentUser = phoneAccountUids.includes(signedInUser.uid);

  if (!alreadyLinkedToCurrentUser && phoneAccountUids.length >= MAX_PHONE_ACCOUNTS) {
    throw new Error('Na ten numer telefonu utworzono juz maksymalna liczbe kont');
  }

  const usersRef = collection(dbInstance, 'users');
  const [phoneNumberSnapshot, legacyPhoneSnapshot, peselSnapshot] = await Promise.all([
    getDocs(query(usersRef, where('phoneNumber', '==', normalizedPhoneNumber), limit(1))),
    getDocs(query(usersRef, where('phone', '==', normalizedPhoneNumber), limit(1))),
    getDocs(query(usersRef, where('pesel', '==', normalizedPesel), limit(1))),
  ]);

  const phoneTakenByAnotherUser =
    !phoneNumberSnapshot.empty &&
    phoneNumberSnapshot.docs.some((docSnapshot) => docSnapshot.id !== signedInUser.uid);
  const legacyPhoneTakenByAnotherUser =
    !legacyPhoneSnapshot.empty &&
    legacyPhoneSnapshot.docs.some((docSnapshot) => docSnapshot.id !== signedInUser.uid);
  const peselTakenByAnotherUser =
    !peselSnapshot.empty && peselSnapshot.docs.some((docSnapshot) => docSnapshot.id !== signedInUser.uid);

  if (phoneTakenByAnotherUser || legacyPhoneTakenByAnotherUser) {
    throw new Error('Ten numer telefonu jest juz przypisany do innego konta.');
  }

  if (peselTakenByAnotherUser) {
    throw new Error('To konto mieszkanca zostalo juz zarejestrowane');
  }

  const userRef = doc(dbInstance, 'users', signedInUser.uid);
  const userPhoneIndexRef = phoneIndexRef(dbInstance, normalizedPhoneNumber);
  const userPeselIndexRef = peselIndexRef(dbInstance, normalizedPesel);

  await runTransaction(dbInstance, async (transaction) => {
    const [existingUserSnapshot, phoneIndexSnapshot, peselIndexSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(userPhoneIndexRef),
      transaction.get(userPeselIndexRef),
    ]);

    if (phoneIndexSnapshot.exists() && phoneIndexSnapshot.data().uid !== signedInUser.uid) {
      throw new Error('Ten numer telefonu jest juz przypisany do innego konta.');
    }

    if (peselIndexSnapshot.exists() && peselIndexSnapshot.data().uid !== signedInUser.uid) {
      throw new Error('To konto mieszkanca zostalo juz zarejestrowane');
    }

    transaction.set(
      userRef,
      {
        phoneNumber: normalizedPhoneNumber,
        phone: normalizedPhoneNumber,
        pesel: normalizedPesel,
        phoneVerified: true,
        canVote: true,
        hasVoted: false,
        votedAt: null,
        eligibleToVote: true,
        verificationStatus: 'verified',
        residentStatus: 'verified_resident',
        commune: 'Mlawa',
        updatedAt: serverTimestamp(),
        ...(existingUserSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );

    if (!phoneIndexSnapshot.exists()) {
      transaction.set(userPhoneIndexRef, {
        uid: signedInUser.uid,
        createdAt: serverTimestamp(),
      });
    }

    if (!peselIndexSnapshot.exists()) {
      transaction.set(userPeselIndexRef, {
        uid: signedInUser.uid,
        createdAt: serverTimestamp(),
      });
    }
  });

  return signedInUser;
}

export async function confirmResidentPhoneLoginCode(
  payload: ConfirmResidentPhoneLoginPayload
): Promise<User> {
  const authInstance = requireAuth();
  const dbInstance = requireDb();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phoneNumber);

  const credential = PhoneAuthProvider.credential(payload.verificationId, payload.smsCode.trim());
  const credentials = await signInWithCredential(authInstance, credential);
  const signedInUser = credentials.user;

  const userRef = doc(dbInstance, 'users', signedInUser.uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    await signOut(authInstance);
    throw new Error('Konto nie jest powiazane z profilem mieszkanca.');
  }

  const userData = userSnapshot.data();
  const hasPesel = typeof userData.pesel === 'string' && userData.pesel.trim().length > 0;
  const hasMatchingPhone =
    userData.phoneNumber === normalizedPhoneNumber || userData.phone === normalizedPhoneNumber;

  if (!hasPesel || !hasMatchingPhone) {
    await signOut(authInstance);
    throw new Error('Konto nie jest poprawnie powiazane z numerem telefonu i numerem PESEL.');
  }

  return signedInUser;
}
