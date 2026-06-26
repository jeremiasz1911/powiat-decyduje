import { PROJECT_STATUS_LABELS } from '@/src/features/projects/constants';

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

  return PROJECT_STATUS_LABELS[status] ?? status;
}
