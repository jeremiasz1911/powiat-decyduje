import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

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
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
