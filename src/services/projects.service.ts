import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
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

import { resolveProjectIcon, type ProjectIconId } from '@/src/features/projects/project-icons';
import { resolveProjectMarkerColor } from '@/src/features/projects/project-marker-colors';
import {
  canUserViewProject,
  canVoteOnProject,
  getProjectAuthorId,
  normalizeProjectStatus,
  type ProjectStatus,
} from '@/src/features/projects/project-status';
import { parseCoordinate } from '@/src/features/projects/utils';
import { db } from '@/src/lib/firebase';
import { uploadProjectImages } from '@/src/services/project-image-upload';

export type CreateProjectPayload = {
  userId: string;
  residentAccountId: string;
  residentPesel: string;
  residentLabel: string;
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
  markerColor: string;
};

export type { ProjectStatus } from '@/src/features/projects/project-status';

export type ProjectItem = {
  id: string;
  authorId: string;
  createdBy: string;
  createdByResidentAccountId: string;
  createdByResidentPesel: string;
  createdByResidentLabel: string;
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
  updatedAt: Timestamp | null;
  reviewedAt: Timestamp | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  status: ProjectStatus;
  votesCount: number;
  icon: ProjectIconId;
  markerColor: string;
};

export type ListProjectsFilters = {
  commune?: string;
  category?: string;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  /** When true (default), only approved projects are returned. */
  publicOnly?: boolean;
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
  markerColor: string;
};

export type VoteProjectOptions = {
  anonymous?: boolean;
};

function normalizeProjectLocation(data: DocumentData): { latitude: number; longitude: number } {
  const locationField = data.location as { latitude?: unknown; longitude?: unknown } | undefined;
  const latitude =
    parseCoordinate(locationField?.latitude) ??
    parseCoordinate(data.latitude) ??
    parseCoordinate((data as { lat?: unknown }).lat);
  const longitude =
    parseCoordinate(locationField?.longitude) ??
    parseCoordinate(data.longitude) ??
    parseCoordinate((data as { lng?: unknown }).lng);

  return {
    latitude: latitude ?? Number.NaN,
    longitude: longitude ?? Number.NaN,
  };
}

function hasStoredVoteCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function countProjectVotes(projectId: string): Promise<number> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const votesCollection = collection(db, 'projects', projectId, 'votes');
  const snapshot = await getCountFromServer(votesCollection);
  return snapshot.data().count;
}

export async function enrichProjectsWithVoteCounts(projects: ProjectItem[]): Promise<ProjectItem[]> {
  return Promise.all(projects.map((project) => enrichProjectVoteCount(project)));
}

async function enrichProjectVoteCount(project: ProjectItem): Promise<ProjectItem> {
  if (project.votesCount >= 0) {
    return project;
  }

  try {
    const count = await countProjectVotes(project.id);
    return { ...project, votesCount: count };
  } catch {
    return { ...project, votesCount: -1 };
  }
}

export async function listProjectsForMap(
  userId?: string | null,
  pageSize = 50,
  maxPages = 10
): Promise<ProjectItem[]> {
  const merged = new Map<string, ProjectItem>();

  let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await listProjects({ pageSize, cursor, publicOnly: true });
    for (const project of result.items) {
      merged.set(project.id, project);
    }
    if (!result.nextCursor) {
      break;
    }
    cursor = result.nextCursor;
  }

  if (userId) {
    let ownCursor: QueryDocumentSnapshot<DocumentData> | null = null;
    try {
      for (let page = 0; page < maxPages; page += 1) {
        const result = await listMyProjects(userId, { pageSize, cursor: ownCursor });
        for (const project of result.items) {
          merged.set(project.id, project);
        }
        if (!result.nextCursor) {
          break;
        }
        ownCursor = result.nextCursor;
      }
    } catch {
      // Publiczne projekty nadal są widoczne, nawet gdy odczyt własnych się nie powiedzie.
    }
  }

  return Array.from(merged.values());
}

function mapProjectDoc(docSnap: QueryDocumentSnapshot<DocumentData>): ProjectItem {
  const data = docSnap.data() as Omit<ProjectItem, 'id' | 'status' | 'authorId'> & {
    status?: string;
    authorId?: string;
  };
  const authorId = getProjectAuthorId({
    authorId: data.authorId,
    createdBy: data.createdBy,
  });

  return {
    id: docSnap.id,
    authorId,
    createdBy: data.createdBy ?? authorId,
    createdByResidentAccountId: data.createdByResidentAccountId ?? '',
    createdByResidentPesel: data.createdByResidentPesel ?? '',
    createdByResidentLabel: data.createdByResidentLabel ?? '',
    title: data.title,
    description: data.description,
    category: data.category,
    locationLabel: data.locationLabel ?? '',
    commune: data.commune,
    village: data.village,
    cost: data.cost,
    imageUrl: data.imageUrl,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [],
    location: normalizeProjectLocation(data),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    reviewedAt: data.reviewedAt ?? null,
    reviewedBy: data.reviewedBy ?? null,
    rejectionReason: data.rejectionReason ?? null,
    status: normalizeProjectStatus(data.status),
    votesCount: hasStoredVoteCount(data.votesCount) ? data.votesCount : -1,
    icon: resolveProjectIcon(data.icon as string | undefined),
    markerColor: resolveProjectMarkerColor(data.markerColor as string | undefined),
  };
}

function isMissingIndexError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === 'failed-precondition' &&
    error.message.toLowerCase().includes('index')
  );
}

export async function createProject(payload: CreateProjectPayload): Promise<string> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const imageUrls = await uploadProjectImages(payload.userId, payload.imageUris);
  const primaryImageUrl = imageUrls[0];

  const docRef = await addDoc(collection(db, 'projects'), {
    authorId: payload.userId,
    createdBy: payload.userId,
    createdByResidentAccountId: payload.residentAccountId,
    createdByResidentPesel: payload.residentPesel,
    createdByResidentLabel: payload.residentLabel,
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
    markerColor: resolveProjectMarkerColor(payload.markerColor),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
  const publicOnly = filters.publicOnly !== false;
  const constraints = [] as Parameters<typeof query>[1][];

  if (publicOnly) {
    constraints.push(where('status', '==', 'approved'));
  }

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
    const items = await enrichProjectsWithVoteCounts(snapshot.docs.map(mapProjectDoc));
    const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor,
    };
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    let cursor = filters.cursor ?? null;
    let attempts = 0;
    const maxAttempts = 5;
    const items: ProjectItem[] = [];

    while (items.length < pageSize && attempts < maxAttempts) {
      const fallbackConstraints = [] as Parameters<typeof query>[1][];

      if (publicOnly) {
        fallbackConstraints.push(where('status', '==', 'approved'));
      }

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
            (!publicOnly || project.status === 'approved') &&
            (!filters.commune || project.commune === filters.commune) &&
            (!filters.category || project.category === filters.category)
        );

      items.push(...filtered);
      attempts += 1;
    }

    return {
      items: await enrichProjectsWithVoteCounts(items.slice(0, pageSize)),
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
    const items = await enrichProjectsWithVoteCounts(snapshot.docs.map(mapProjectDoc));
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
      fallbackConstraints.push(where('createdBy', '==', userId));

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
      const filtered = snapshot.docs.map(mapProjectDoc);
      items.push(...filtered);
      attempts += 1;
    }

    return {
      items: await enrichProjectsWithVoteCounts(items.slice(0, pageSize)),
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

export async function getProjectById(
  projectId: string,
  options: { userId?: string | null } = {}
): Promise<ProjectItem> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const projectRef = doc(db, 'projects', projectId);
  const snapshot = await getDoc(projectRef);

  if (!snapshot.exists()) {
    throw new Error('Project not found.');
  }

  const project = mapProjectDoc(snapshot as QueryDocumentSnapshot<DocumentData>);

  if (!canUserViewProject(project, options.userId)) {
    throw new Error('Brak dostępu do tego projektu.');
  }

  return enrichProjectVoteCount(project);
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

  if (getProjectAuthorId(existing) !== userId) {
    throw new Error('Nie masz uprawnien do edycji tego projektu.');
  }

  if (normalizeProjectStatus(existing.status) !== 'submitted') {
    throw new Error('Możesz edytować projekt tylko przed weryfikacją przez administratora.');
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
    markerColor: resolveProjectMarkerColor(payload.markerColor),
    updatedAt: serverTimestamp(),
  });
}

const MAX_VOTES_PER_USER = 5;

export async function voteForProject(
  projectId: string,
  userId: string,
  installationId: string,
  options: VoteProjectOptions = {}
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

    const projectStatus = normalizeProjectStatus(projectSnap.data().status);
    if (!canVoteOnProject(projectStatus)) {
      throw new Error('Głosowanie jest dostępne tylko dla zaakceptowanych projektów.');
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
      isAnonymous: options.anonymous ?? false,
    });

    transaction.set(installationVoteRef, {
      userId,
      installationId,
      createdAt: serverTimestamp(),
      isAnonymous: options.anonymous ?? false,
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
