import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type ProjectIconId = ComponentProps<typeof Ionicons>['name'];

export const PROJECT_ICON_OPTIONS = [
  { id: 'construct-outline', label: 'Infrastruktura' },
  { id: 'school-outline', label: 'Edukacja' },
  { id: 'football-outline', label: 'Sport' },
  { id: 'leaf-outline', label: 'Ekologia' },
  { id: 'color-palette-outline', label: 'Kultura' },
  { id: 'location-outline', label: 'Inne' },
] as const satisfies ReadonlyArray<{ id: ProjectIconId; label: string }>;

export const DEFAULT_PROJECT_ICON: ProjectIconId = 'location-outline';

const PROJECT_ICON_ID_SET = new Set<string>(PROJECT_ICON_OPTIONS.map((option) => option.id));

export const isProjectIconId = (value: string): value is ProjectIconId =>
  PROJECT_ICON_ID_SET.has(value);

export const resolveProjectIcon = (value?: string | null): ProjectIconId => {
  if (value && isProjectIconId(value)) {
    return value;
  }

  return DEFAULT_PROJECT_ICON;
};
