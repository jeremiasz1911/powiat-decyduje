import { PROJECT_STATUS_LABELS } from '@/src/features/projects/constants';
import { normalizeProjectStatus } from '@/src/features/projects/project-status';
import { type ProjectItem } from '@/src/services';

export function truncateText(value: string, maxLength = 140): string {
  const normalized = value.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getProjectCategoryLabel(category?: string | null): string {
  return category?.trim() || 'Brak kategorii';
}

export function getProjectCommuneLabel(commune?: string | null): string {
  return commune?.trim() || 'Brak gminy';
}

export function getProjectStatusLabel(status?: string | null): string {
  if (!status?.trim()) {
    return 'Brak statusu';
  }

  const normalized = normalizeProjectStatus(status);
  return PROJECT_STATUS_LABELS[normalized] ?? PROJECT_STATUS_LABELS[status] ?? status;
}

export function getProjectImageUrls(project: Pick<ProjectItem, 'imageUrl' | 'imageUrls'>): string[] {
  if (project.imageUrls?.length) {
    return project.imageUrls.filter(Boolean);
  }

  if (project.imageUrl?.trim()) {
    return [project.imageUrl];
  }

  return [];
}

export type ProjectStatusTone = 'positive' | 'done' | 'negative' | 'neutral';

export function getProjectStatusTone(status?: string | null): ProjectStatusTone {
  switch (normalizeProjectStatus(status)) {
    case 'approved':
      return 'positive';
    case 'rejected':
      return 'negative';
    default:
      return 'neutral';
  }
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

export function getProjectCoordinates(
  project: Pick<ProjectItem, 'location'> & {
    latitude?: unknown;
    longitude?: unknown;
  }
): { latitude: number; longitude: number } | null {
  const nested = project.location as { latitude?: unknown; longitude?: unknown } | undefined;
  const latitude =
    parseCoordinate(nested?.latitude) ??
    parseCoordinate(project.latitude) ??
    parseCoordinate((project as { lat?: unknown }).lat);
  const longitude =
    parseCoordinate(nested?.longitude) ??
    parseCoordinate(project.longitude) ??
    parseCoordinate((project as { lng?: unknown }).lng);

  if (latitude == null || longitude == null) {
    return null;
  }

  return { latitude, longitude };
}

export function formatVotesCountLabel(count: number): string {
  if (!Number.isFinite(count) || count < 0) {
    return 'Brak danych o głosach';
  }

  if (count === 0) {
    return '0 głosów';
  }

  if (count === 1) {
    return '1 głos';
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} głosy`;
  }

  return `${count} głosów`;
}
