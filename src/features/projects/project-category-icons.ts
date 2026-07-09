import type { ProjectIconId } from '@/src/features/projects/project-icons';
import { resolveProjectIcon } from '@/src/features/projects/project-icons';

export function getCategoryMapIcon(category?: string | null): ProjectIconId {
  switch (category?.trim()) {
    case 'Edukacja':
      return 'school-outline';
    case 'Sport':
      return 'football-outline';
    case 'Ekologia':
      return 'leaf-outline';
    case 'Infrastruktura':
      return 'construct-outline';
    case 'Kultura':
      return 'color-palette-outline';
    default:
      return 'location-outline';
  }
}

export function resolveMapProjectIcon(project: {
  icon?: string | null;
  category?: string | null;
}): ProjectIconId {
  const explicit = resolveProjectIcon(project.icon);
  if (project.icon && explicit !== 'location-outline') {
    return explicit;
  }

  return getCategoryMapIcon(project.category);
}
