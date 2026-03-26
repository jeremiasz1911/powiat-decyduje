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
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from '@/src/lib/firebase';
import { ensureAnonymousAuth } from '@/src/services/auth.service';

export type CreateProjectPayload = {
  userId: string;
  title: string;
  description: string;
  category: string;
  commune: string;
  village: string;
  cost: number;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUri: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  commune: string;
  village: string;
  cost: number;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp | null;
  status: string;
  votesCount: number;
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

async function fileUriToBlob(fileUri: string): Promise<Blob> {
  const response = await fetch(fileUri);

  if (!response.ok) {
    throw new Error('Unable to read selected image file.');
  }

  return response.blob();
}

async function uploadProjectImage(userId: string, imageUri: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  const blob = await fileUriToBlob(imageUri);
  const fileRef = ref(storage, `projects/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);

  await uploadBytes(fileRef, blob, {
    contentType: 'image/jpeg',
  });

  return getDownloadURL(fileRef);
}

export async function createProject(payload: CreateProjectPayload): Promise<string> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const imageUrl = await uploadProjectImage(payload.userId, payload.imageUri);

  const docRef = await addDoc(collection(db, 'projects'), {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    commune: payload.commune,
    village: payload.village,
    cost: payload.cost,
    location: payload.location,
    imageUrl,
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

  await ensureAnonymousAuth();

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

  const projectsQuery = query(collection(db, 'projects'), ...constraints);
  const snapshot = await getDocs(projectsQuery);

  const items: ProjectItem[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<ProjectItem, 'id'>;

    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      commune: data.commune,
      village: data.village,
      cost: data.cost,
      imageUrl: data.imageUrl,
      location: data.location,
      createdAt: data.createdAt ?? null,
      status: data.status ?? 'submitted',
      votesCount: data.votesCount ?? 0,
    };
  });

  const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    items,
    nextCursor,
  };
}

export async function getProjectById(projectId: string): Promise<ProjectItem> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  await ensureAnonymousAuth();

  const projectRef = doc(db, 'projects', projectId);
  const snapshot = await getDoc(projectRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found.');
  }

  const data = snapshot.data() as Omit<ProjectItem, 'id'>;

  return {
    id: snapshot.id,
    title: data.title,
    description: data.description,
    category: data.category,
    commune: data.commune,
    village: data.village,
    cost: data.cost,
    imageUrl: data.imageUrl,
    location: data.location,
    createdAt: data.createdAt ?? null,
    status: data.status ?? 'submitted',
    votesCount: data.votesCount ?? 0,
  };
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
