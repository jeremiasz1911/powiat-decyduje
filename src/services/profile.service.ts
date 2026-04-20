import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';

import { db } from '@/src/lib/firebase';

export type ResidentProfilePayload = {
  uid: string;
  fullName: string;
  email?: string;
  phone?: string;
  village: string;
  street?: string;
};

export type ResidentProfile = {
  uid: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  village: string;
  street: string | null;
  commune: 'Mlawa';
  residentStatus: 'verified_resident';
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ResidentVotingStatus = {
  hasVoted: boolean;
  votedAt: Timestamp | null;
  eligibleToVote: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
};

type ResidentAccountProfilePayload = {
  uid: string;
  residentAccountId: string;
  fullName: string;
  email?: string;
  phone?: string;
  village: string;
  street?: string;
};

export async function getResidentProfile(uid: string): Promise<ResidentProfile | null> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  if (data.commune !== 'Mlawa') {
    return null;
  }

  return {
    uid,
    fullName: data.fullName ?? '',
    email: data.email ?? null,
    phone: data.phone ?? null,
    village: data.village ?? '',
    street: data.street ?? null,
    commune: 'Mlawa',
    residentStatus: 'verified_resident',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function upsertResidentProfile(payload: ResidentProfilePayload): Promise<void> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const ref = doc(db, 'users', payload.uid);

  await setDoc(
    ref,
    {
      fullName: payload.fullName,
      email: payload.email || null,
      phone: payload.phone || null,
      village: payload.village,
      street: payload.street || null,
      commune: 'Mlawa',
      residentStatus: 'verified_resident',
      hasVoted: false,
      votedAt: null,
      eligibleToVote: true,
      verificationStatus: 'verified',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateResidentVotingStatus(uid: string, status: ResidentVotingStatus): Promise<void> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const ref = doc(db, 'users', uid);

  await setDoc(
    ref,
    {
      hasVoted: status.hasVoted,
      votedAt: status.votedAt,
      eligibleToVote: status.eligibleToVote,
      verificationStatus: status.verificationStatus,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getResidentAccountProfile(
  uid: string,
  residentAccountId: string
): Promise<ResidentProfile | null> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const ref = doc(db, 'users', uid, 'resident_profiles', residentAccountId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    uid,
    fullName: data.fullName ?? '',
    email: data.email ?? null,
    phone: data.phone ?? null,
    village: data.village ?? 'Mlawa',
    street: data.street ?? null,
    commune: 'Mlawa',
    residentStatus: 'verified_resident',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function upsertResidentAccountProfile(
  payload: ResidentAccountProfilePayload
): Promise<void> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const profileRef = doc(db, 'users', payload.uid, 'resident_profiles', payload.residentAccountId);
  const userRef = doc(db, 'users', payload.uid);
  const profileSnapshot = await getDoc(profileRef);
  const userSnapshot = await getDoc(userRef);
  const userData = userSnapshot.data() as Record<string, unknown> | undefined;
  const residentAccounts = Array.isArray(userData?.residentAccounts)
    ? (userData?.residentAccounts as Record<string, unknown>[])
    : [];

  await setDoc(
    profileRef,
    {
      fullName: payload.fullName,
      email: payload.email || null,
      phone: payload.phone || null,
      village: payload.village,
      street: payload.street || null,
      commune: 'Mlawa',
      residentStatus: 'verified_resident',
      updatedAt: serverTimestamp(),
      ...(profileSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  if (!residentAccounts.length) {
    return;
  }

  const nextResidentAccounts = residentAccounts.map((account) => {
    if (account.id !== payload.residentAccountId) {
      return account;
    }

    return {
      ...account,
      label: payload.fullName,
    };
  });

  await setDoc(
    userRef,
    {
      residentAccounts: nextResidentAccounts,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
