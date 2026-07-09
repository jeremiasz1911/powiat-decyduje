export type ProjectStatus = 'submitted' | 'approved' | 'rejected';

export const PROJECT_STATUSES: ProjectStatus[] = ['submitted', 'approved', 'rejected'];

export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (value === 'approved' || value === 'rejected' || value === 'submitted') {
    return value;
  }

  // Legacy statuses from earlier versions — treat as submitted until admin reviews.
  if (
    value === 'pending' ||
    value === 'review' ||
    value === 'zgloszony' ||
    value === 'oczekujacy'
  ) {
    return 'submitted';
  }

  if (value === 'active' || value === 'voting' || value === 'zaakceptowany') {
    return 'approved';
  }

  if (value === 'odrzucony') {
    return 'rejected';
  }

  return 'submitted';
}

export function isProjectPubliclyVisible(status: unknown): boolean {
  return normalizeProjectStatus(status) === 'approved';
}

export function canVoteOnProject(status: unknown): boolean {
  return isProjectPubliclyVisible(status);
}

export function getProjectAuthorId(project: { authorId?: string; createdBy?: string }): string {
  return project.authorId?.trim() || project.createdBy?.trim() || '';
}

export function canUserViewProject(
  project: { status?: unknown; authorId?: string; createdBy?: string },
  userId?: string | null
): boolean {
  if (isProjectPubliclyVisible(project.status)) {
    return true;
  }

  if (!userId) {
    return false;
  }

  return getProjectAuthorId(project) === userId;
}

export function canUserEditProject(
  project: { status?: unknown; authorId?: string; createdBy?: string },
  userId?: string | null
): boolean {
  if (!userId || getProjectAuthorId(project) !== userId) {
    return false;
  }

  return normalizeProjectStatus(project.status) === 'submitted';
}
