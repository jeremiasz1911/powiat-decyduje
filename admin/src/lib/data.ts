import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { getFirestore } from '@/lib/firebase-admin';
import {
  type AdminProject,
  type AdminSmsLog,
  type AdminUser,
  type AdminVoteActivity,
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  type ProjectStatus,
  timestampToIso,
} from '@/lib/types';

function normalizeAdminProjectStatus(value: unknown): ProjectStatus {
  if (value === 'approved' || value === 'rejected' || value === 'submitted') {
    return value;
  }
  if (value === 'active' || value === 'voting') {
    return 'approved';
  }
  return 'submitted';
}

export function mapProjectDoc(doc: QueryDocumentSnapshot<DocumentData>): AdminProject {
  const data = doc.data();
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.filter(Boolean)
    : data.imageUrl
      ? [data.imageUrl]
      : [];
  const authorId = String(data.authorId ?? data.createdBy ?? '');

  return {
    id: doc.id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: String(data.category ?? ''),
    commune: String(data.commune ?? ''),
    village: String(data.village ?? ''),
    locationLabel: data.locationLabel ? String(data.locationLabel) : undefined,
    status: normalizeAdminProjectStatus(data.status),
    authorId,
    votesCount: typeof data.votesCount === 'number' ? data.votesCount : 0,
    createdByResidentLabel: String(data.createdByResidentLabel ?? 'Nieznany'),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    reviewedAt: timestampToIso(data.reviewedAt),
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : null,
    rejectionReason: data.rejectionReason ? String(data.rejectionReason) : null,
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    imageUrls,
    markerColor: data.markerColor ? String(data.markerColor) : undefined,
    icon: data.icon ? String(data.icon) : undefined,
    location: data.location as AdminProject['location'],
    cost: typeof data.cost === 'number' ? data.cost : undefined,
  };
}

export async function fetchAllProjects(): Promise<AdminProject[]> {
  const db = getFirestore();
  const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(mapProjectDoc);
}

export async function fetchProjectById(id: string): Promise<AdminProject | null> {
  const db = getFirestore();
  const doc = await db.collection('projects').doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return mapProjectDoc(doc as QueryDocumentSnapshot<DocumentData>);
}

export async function deleteProjectById(id: string): Promise<void> {
  const db = getFirestore();
  const projectRef = db.collection('projects').doc(id);

  const votesSnapshot = await projectRef.collection('votes').get();
  const batch = db.batch();
  votesSnapshot.docs.forEach((voteDoc) => batch.delete(voteDoc.ref));

  const installationVotesSnapshot = await projectRef.collection('installationVotes').get();
  installationVotesSnapshot.docs.forEach((voteDoc) => batch.delete(voteDoc.ref));

  batch.delete(projectRef);
  await batch.commit();
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const db = getFirestore();
  const snapshot = await db.collection('users').get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const residentAccounts = Array.isArray(data.residentAccounts) ? data.residentAccounts : [];

    return {
      id: doc.id,
      fullName: String(data.fullName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()),
      phoneNumber: String(data.phoneNumber ?? ''),
      email: String(data.email ?? ''),
      commune: String(data.commune ?? ''),
      phoneVerified: Boolean(data.phoneVerified),
      emailVerified: Boolean(data.emailVerified),
      votesUsed: typeof data.votesUsed === 'number' ? data.votesUsed : 0,
      createdAt: timestampToIso(data.createdAt),
      residentAccountsCount: residentAccounts.length,
    };
  });
}

export async function fetchSmsLogs(limit = 50): Promise<AdminSmsLog[]> {
  const db = getFirestore();
  const snapshot = await db.collection('sms_logs').orderBy('sentAt', 'desc').limit(limit).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      phoneNumber: String(data.phoneNumber ?? data.phoneMasked ?? ''),
      type: String(data.type ?? 'unknown'),
      status: String(data.status ?? 'unknown'),
      errorMessage: data.errorMessage ? String(data.errorMessage) : null,
      sentAt: timestampToIso(data.sentAt),
    };
  });
}

export async function fetchRecentVotes(limit = 12): Promise<AdminVoteActivity[]> {
  const db = getFirestore();
  const projectsSnapshot = await db.collection('projects').orderBy('createdAt', 'desc').limit(40).get();
  const activities: AdminVoteActivity[] = [];

  for (const projectDoc of projectsSnapshot.docs) {
    const votesSnapshot = await projectDoc.ref.collection('votes').orderBy('createdAt', 'desc').limit(5).get();
    for (const voteDoc of votesSnapshot.docs) {
      const vote = voteDoc.data();
      activities.push({
        id: voteDoc.id,
        projectId: projectDoc.id,
        projectTitle: String(projectDoc.data().title ?? projectDoc.id),
        userId: String(vote.userId ?? voteDoc.id),
        isAnonymous: Boolean(vote.isAnonymous),
        createdAt: timestampToIso(vote.createdAt),
      });
    }
  }

  return activities
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, limit);
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const db = getFirestore();
  const doc = await db.collection('app_settings').doc('main').get();

  if (!doc.exists) {
    return DEFAULT_APP_SETTINGS;
  }

  const data = doc.data() ?? {};
  return {
    appName: String(data.appName ?? DEFAULT_APP_SETTINGS.appName),
    votingEnabled: data.votingEnabled !== false,
    projectSubmissionEnabled: data.projectSubmissionEnabled !== false,
    anonymousVotingEnabled: data.anonymousVotingEnabled !== false,
    maxVotesPerUser:
      typeof data.maxVotesPerUser === 'number' ? data.maxVotesPerUser : DEFAULT_APP_SETTINGS.maxVotesPerUser,
    infoText: String(data.infoText ?? DEFAULT_APP_SETTINGS.infoText),
    contactEmail: String(data.contactEmail ?? DEFAULT_APP_SETTINGS.contactEmail),
    contactPhone: String(data.contactPhone ?? DEFAULT_APP_SETTINGS.contactPhone),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const db = getFirestore();
  await db
    .collection('app_settings')
    .doc('main')
    .set(
      {
        ...settings,
        updatedAt: new Date(),
      },
      { merge: true }
    );
}

export function countProjectsByStatus(projects: AdminProject[]) {
  return {
    total: projects.length,
    pending: projects.filter((p) => p.status === 'submitted').length,
    approved: projects.filter((p) => p.status === 'approved').length,
    rejected: projects.filter((p) => p.status === 'rejected').length,
    withLocation: projects.filter((p) => {
      const loc = p.location;
      return (
        loc &&
        typeof loc.latitude === 'number' &&
        typeof loc.longitude === 'number' &&
        Number.isFinite(loc.latitude) &&
        Number.isFinite(loc.longitude)
      );
    }).length,
    totalVotes: projects.reduce((sum, p) => sum + (p.votesCount ?? 0), 0),
  };
}
