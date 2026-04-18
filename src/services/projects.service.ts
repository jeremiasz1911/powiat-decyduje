import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';

import { resolveProjectIcon, type ProjectIconId } from '@/src/features/projects/project-icons';
import { db, storage } from '@/src/lib/firebase';

export type CreateProjectPayload = {
  userId: string;
  title: string;
  description: string;
  category: string;
  locationLabel: string;
  commune: string;
  village: string;
  cost: number;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUris: string[];
  icon: ProjectIconId;
};

export type ProjectItem = {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  category: string;
  locationLabel?: string;
  commune: string;
  village: string;
  cost: number;
  imageUrl: string;
  imageUrls?: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp | null;
  status: string;
  votesCount: number;
  icon: ProjectIconId;
};

export type ListProjectsFilters = {
  commune?: string;
  category?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
};

export type ListProjectsResult = {
  items: ProjectItem[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
};

export type VoteProjectResult = {
  added: boolean;
  votesCount: number;
  remainingVotes: number;
  reason?: 'already_voted' | 'vote_limit_reached';
};

export type VotesSummary = {
  votesUsed: number;
  votesRemaining: number;
};

export type VoteLimitCheckResult = {
  votesUsed: number;
  votesRemaining: number;
  limitReached: boolean;
  maxVotes: number;
};

export type UpdateProjectPayload = {
  title: string;
  description: string;
  category: string;
  locationLabel: string;
  commune: string;
  village: string;
  cost: number;
  location: {
    latitude: number;
    longitude: number;
  };
  icon: ProjectIconId;
};

function mapProjectDoc(docSnap: QueryDocumentSnapshot<DocumentData>): ProjectItem {
  const data = docSnap.data() as Omit<ProjectItem, 'id'>;

  return {
    id: docSnap.id,
    createdBy: data.createdBy ?? '',
    title: data.title,
    description: data.description,
    category: data.category,
    locationLabel: data.locationLabel ?? '',
    commune: data.commune,
    village: data.village,
    cost: data.cost,
    imageUrl: data.imageUrl,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [],
    location: data.location,
    createdAt: data.createdAt ?? null,
    status: data.status ?? 'submitted',
    votesCount: data.votesCount ?? 0,
    icon: resolveProjectIcon(data.icon as string | undefined),
  };
}

function isMissingIndexError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === 'failed-precondition' &&
    error.message.toLowerCase().includes('index')
  );
}

async function fileUriToBlob(fileUri: string): Promise<Blob> {
  // On React Native, fetch(file://...) can fail with "Network request failed".
  // XHR with responseType=blob is significantly more reliable for local URIs.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = async () => {
      try {
        const fallbackResponse = await fetch(fileUri);
        if (!fallbackResponse.ok) {
          reject(new Error(`Unable to read selected image file (HTTP ${fallbackResponse.status}).`));
          return;
        }
        const fallbackBlob = await fallbackResponse.blob();
        resolve(fallbackBlob);
      } catch {
        reject(new Error(`Unable to read selected image file (${fileUri.slice(0, 24)}...).`));
      }
    };
    xhr.onload = () => {
      if (!xhr.response) {
        reject(new Error('Unable to read selected image file.'));
        return;
      }

      resolve(xhr.response as Blob);
    };
    xhr.responseType = 'blob';
    xhr.open('GET', fileUri, true);
    xhr.send();
  });
}

async function uploadProjectImage(userId: string, imageUri: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  const fileRef = ref(storage, `projects/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);

  if (imageUri.startsWith('data:')) {
    const match = imageUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Niepoprawny format danych obrazu.');
    }

    const [, contentType, base64Data] = match;
    await uploadString(fileRef, base64Data, 'base64', { contentType });
    return getDownloadURL(fileRef);
  }

  const blob = await fileUriToBlob(imageUri);
  try {
    await uploadBytes(fileRef, blob, {
      contentType: 'image/jpeg',
    });
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Blad wysylania obrazu: ${error.code}`);
    }
    throw error;
  } finally {
    const maybeClosable = blob as Blob & { close?: () => void };
    maybeClosable.close?.();
  }

  return getDownloadURL(fileRef);
}

async function uploadProjectImages(userId: string, imageUris: string[]): Promise<string[]> {
  const uploads = imageUris.map((uri) => uploadProjectImage(userId, uri));
  return Promise.all(uploads);
}

export async function createProject(payload: CreateProjectPayload): Promise<string> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const imageUrls = await uploadProjectImages(payload.userId, payload.imageUris);
  const primaryImageUrl = imageUrls[0];

  const docRef = await addDoc(collection(db, 'projects'), {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    locationLabel: payload.locationLabel,
    commune: payload.commune,
    village: payload.village,
    cost: payload.cost,
    location: payload.location,
    imageUrl: primaryImageUrl,
    imageUrls,
    icon: payload.icon,
    createdBy: payload.userId,
    createdAt: serverTimestamp(),
    status: 'submitted',
    votesCount: 0,
  });

  return docRef.id;
}

export async function listProjects(filters: ListProjectsFilters = {}): Promise<ListProjectsResult> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const pageSize = filters.pageSize ?? 10;
  const constraints = [] as Parameters<typeof query>[1][];

  if (filters.commune) {
    constraints.push(where('commune', '==', filters.commune));
  }

  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (filters.cursor) {
    constraints.push(startAfter(filters.cursor));
  }

  constraints.push(limit(pageSize));

  const projectsCollection = collection(db, 'projects');

  try {
    const projectsQuery = query(projectsCollection, ...constraints);
    const snapshot = await getDocs(projectsQuery);
    const items = snapshot.docs.map(mapProjectDoc);
    const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor,
    };
  } catch (error) {
    // Fallback when composite index is still building/missing.
    if (!isMissingIndexError(error) || (!filters.commune && !filters.category)) {
      throw error;
    }

    let cursor = filters.cursor ?? null;
    let attempts = 0;
    const maxAttempts = 5;
    const items: ProjectItem[] = [];

    while (items.length < pageSize && attempts < maxAttempts) {
      const fallbackConstraints = [] as Parameters<typeof query>[1][];

      fallbackConstraints.push(orderBy('createdAt', 'desc'));
      if (cursor) {
        fallbackConstraints.push(startAfter(cursor));
      }
      fallbackConstraints.push(limit(pageSize));

      const snapshot = await getDocs(query(projectsCollection, ...fallbackConstraints));
      if (snapshot.empty) {
        cursor = null;
        break;
      }

      cursor = snapshot.docs[snapshot.docs.length - 1];

      const filtered = snapshot.docs
        .map(mapProjectDoc)
        .filter(
          (project) =>
            (!filters.commune || project.commune === filters.commune) &&
            (!filters.category || project.category === filters.category)
        );

      items.push(...filtered);
      attempts += 1;
    }

    return {
      items: items.slice(0, pageSize),
      nextCursor: cursor,
    };
  }
}

export async function listMyProjects(
  userId: string,
  options: { pageSize?: number; cursor?: QueryDocumentSnapshot<DocumentData> | null } = {}
): Promise<ListProjectsResult> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const pageSize = options.pageSize ?? 10;
  const constraints = [] as Parameters<typeof query>[1][];

  constraints.push(where('createdBy', '==', userId));
  constraints.push(orderBy('createdAt', 'desc'));

  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  constraints.push(limit(pageSize));

  const projectsCollection = collection(db, 'projects');

  try {
    const snapshot = await getDocs(query(projectsCollection, ...constraints));
    const items = snapshot.docs.map(mapProjectDoc);
    const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor,
    };
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    let cursor = options.cursor ?? null;
    let attempts = 0;
    const maxAttempts = 5;
    const items: ProjectItem[] = [];

    while (items.length < pageSize && attempts < maxAttempts) {
      const fallbackConstraints = [] as Parameters<typeof query>[1][];
      fallbackConstraints.push(orderBy('createdAt', 'desc'));

      if (cursor) {
        fallbackConstraints.push(startAfter(cursor));
      }

      fallbackConstraints.push(limit(pageSize));

      const snapshot = await getDocs(query(projectsCollection, ...fallbackConstraints));

      if (snapshot.empty) {
        cursor = null;
        break;
      }

      cursor = snapshot.docs[snapshot.docs.length - 1];
      const filtered = snapshot.docs.map(mapProjectDoc).filter((project) => project.createdBy === userId);
      items.push(...filtered);
      attempts += 1;
    }

    return {
      items: items.slice(0, pageSize),
      nextCursor: cursor,
    };
  }
}

export async function getVotedProjectIds(userId: string): Promise<string[]> {
  return listProjectsVotedByUser(userId, []);
}

export async function listProjectsVotedByUser(
  userId: string,
  projects: ProjectItem[]
): Promise<string[]> {
  const firestore = db;

  if (!firestore) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const voted: string[] = [];

  await Promise.all(
    projects.map(async (project) => {
      const voteRef = doc(firestore, 'projects', project.id, 'votes', userId);
      const snapshot = await getDoc(voteRef);

      if (snapshot.exists()) {
        voted.push(project.id);
      }
    })
  );

  return voted;
}

export async function getVotesSummary(userId: string): Promise<VotesSummary> {
  const limit = await checkUserVoteLimit(userId);

  return {
    votesUsed: limit.votesUsed,
    votesRemaining: limit.votesRemaining,
  };
}

export async function checkUserVoteLimit(userId: string): Promise<VoteLimitCheckResult> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  const votesUsed = (snapshot.data()?.votesUsed as number | undefined) ?? 0;
  const votesRemaining = Math.max(0, MAX_VOTES_PER_USER - votesUsed);

  return {
    votesUsed,
    votesRemaining,
    limitReached: votesRemaining === 0,
    maxVotes: MAX_VOTES_PER_USER,
  };
}

export async function getProjectById(projectId: string): Promise<ProjectItem> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const projectRef = doc(db, 'projects', projectId);
  const snapshot = await getDoc(projectRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found.');
  }

  const data = snapshot.data() as Omit<ProjectItem, 'id'>;

  return {
    id: snapshot.id,
    createdBy: data.createdBy ?? '',
    title: data.title,
    description: data.description,
    category: data.category,
    locationLabel: data.locationLabel ?? '',
    commune: data.commune,
    village: data.village,
    cost: data.cost,
    imageUrl: data.imageUrl,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [],
    location: data.location,
    createdAt: data.createdAt ?? null,
    status: data.status ?? 'submitted',
    votesCount: data.votesCount ?? 0,
    icon: resolveProjectIcon(data.icon as string | undefined),
  };
}

export async function updateProject(
  projectId: string,
  userId: string,
  payload: UpdateProjectPayload
): Promise<void> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const projectRef = doc(db, 'projects', projectId);
  const snapshot = await getDoc(projectRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found.');
  }

  const existing = snapshot.data() as Partial<ProjectItem>;

  if (existing.createdBy !== userId) {
    throw new Error('Nie masz uprawnien do edycji tego projektu.');
  }

  await updateDoc(projectRef, {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    locationLabel: payload.locationLabel,
    commune: payload.commune,
    village: payload.village,
    cost: payload.cost,
    location: payload.location,
    icon: payload.icon,
    updatedAt: serverTimestamp(),
  });
}

const MAX_VOTES_PER_USER = 5;

export async function voteForProject(
  projectId: string,
  userId: string,
  installationId: string
): Promise<VoteProjectResult> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const projectRef = doc(db, 'projects', projectId);
  const voteLimit = await checkUserVoteLimit(userId);
  if (voteLimit.limitReached) {
    const projectSnapshot = await getDoc(projectRef);
    const currentVotes = (projectSnapshot.data()?.votesCount as number | undefined) ?? 0;

    return {
      added: false,
      votesCount: currentVotes,
      remainingVotes: 0,
      reason: 'vote_limit_reached',
    };
  }

  const userVoteRef = doc(db, 'projects', projectId, 'votes', userId);
  const installationVoteRef = doc(db, 'projects', projectId, 'installationVotes', installationId);
  const userVotesCounterRef = doc(db, 'users', userId);

  return runTransaction(db, async (transaction) => {
    const [projectSnap, voteSnap, installationVoteSnap, userVotesCounterSnap] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(userVoteRef),
      transaction.get(installationVoteRef),
      transaction.get(userVotesCounterRef),
    ]);

    if (!projectSnap.exists()) {
      throw new Error('Project not found.');
    }

    const currentVotes = (projectSnap.data().votesCount as number | undefined) ?? 0;
    const usedVotes = (userVotesCounterSnap.data()?.votesUsed as number | undefined) ?? 0;

    if (voteSnap.exists() || installationVoteSnap.exists()) {
      return {
        added: false,
        votesCount: currentVotes,
        remainingVotes: Math.max(0, MAX_VOTES_PER_USER - usedVotes),
        reason: 'already_voted',
      };
    }

    if (usedVotes >= MAX_VOTES_PER_USER) {
      return {
        added: false,
        votesCount: currentVotes,
        remainingVotes: 0,
        reason: 'vote_limit_reached',
      };
    }

    transaction.set(userVoteRef, {
      userId,
      installationId,
      createdAt: serverTimestamp(),
    });

    transaction.set(installationVoteRef, {
      userId,
      installationId,
      createdAt: serverTimestamp(),
    });

    transaction.update(projectRef, {
      votesCount: increment(1),
    });

    transaction.set(
      userVotesCounterRef,
      {
        votesUsed: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      added: true,
      votesCount: currentVotes + 1,
      remainingVotes: Math.max(0, MAX_VOTES_PER_USER - (usedVotes + 1)),
    };
  });
}
