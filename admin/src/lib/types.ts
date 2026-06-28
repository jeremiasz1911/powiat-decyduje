import type { Timestamp } from 'firebase-admin/firestore';

export type ProjectStatus = 'submitted' | 'approved' | 'rejected';

export type AdminProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  commune: string;
  village: string;
  locationLabel?: string;
  status: ProjectStatus;
  authorId: string;
  votesCount: number;
  createdByResidentLabel: string;
  createdAt: string | null;
  updatedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  imageUrl?: string;
  imageUrls?: string[];
  markerColor?: string;
  icon?: string;
  location?: { latitude: number; longitude: number };
  cost?: number;
};

export type AdminUser = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  commune: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  votesUsed: number;
  createdAt: string | null;
  residentAccountsCount: number;
};

export type AdminSmsLog = {
  id: string;
  phoneNumber: string;
  type: string;
  status: string;
  errorMessage?: string | null;
  sentAt: string | null;
};

export type AdminVoteActivity = {
  id: string;
  projectId: string;
  projectTitle: string;
  userId: string;
  isAnonymous: boolean;
  createdAt: string | null;
};

export type AppSettings = {
  appName: string;
  votingEnabled: boolean;
  projectSubmissionEnabled: boolean;
  anonymousVotingEnabled: boolean;
  maxVotesPerUser: number;
  infoText: string;
  contactEmail: string;
  contactPhone: string;
  updatedAt: string | null;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appName: 'Powiat Decyduje',
  votingEnabled: true,
  projectSubmissionEnabled: true,
  anonymousVotingEnabled: true,
  maxVotesPerUser: 5,
  infoText: 'Aplikacja obywatelska powiatu mławskiego.',
  contactEmail: 'kontakt@powiat-mlawski.pl',
  contactPhone: '',
  updatedAt: null,
};

export function timestampToIso(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const date = (value as Timestamp).toDate();
    return date.toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

export function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function getProjectCoordinates(project: AdminProject): { latitude: number; longitude: number } | null {
  const nested = project.location;
  const lat = parseCoordinate(nested?.latitude);
  const lng = parseCoordinate(nested?.longitude);
  if (lat == null || lng == null) {
    return null;
  }
  return { latitude: lat, longitude: lng };
}
