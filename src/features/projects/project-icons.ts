import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type ProjectIconId = ComponentProps<typeof Ionicons>['name'];

export const PROJECT_ICON_OPTIONS = [
  { id: 'construct-outline', label: 'Infrastruktura' },
  { id: 'school-outline', label: 'Edukacja' },
  { id: 'football-outline', label: 'Sport' },
  { id: 'leaf-outline', label: 'Ekologia' },
  { id: 'color-palette-outline', label: 'Kultura' },
  { id: 'walk-outline', label: 'Chodniki' },
  { id: 'bicycle-outline', label: 'Sciezki rowerowe' },
  { id: 'car-sport-outline', label: 'Drogi i parkingi' },
  { id: 'bus-outline', label: 'Transport' },
  { id: 'fitness-outline', label: 'Rekreacja' },
  { id: 'basketball-outline', label: 'Boiska' },
  { id: 'medkit-outline', label: 'Zdrowie' },
  { id: 'people-outline', label: 'Spolecznosc' },
  { id: 'paw-outline', label: 'Zwierzeta' },
  { id: 'water-outline', label: 'Woda' },
  { id: 'flash-outline', label: 'Energia' },
  { id: 'sunny-outline', label: 'Zielen i klimat' },
  { id: 'library-outline', label: 'Biblioteka' },
  { id: 'musical-notes-outline', label: 'Muzyka' },
  { id: 'camera-outline', label: 'Media' },
  { id: 'desktop-outline', label: 'Cyfryzacja' },
  { id: 'shield-checkmark-outline', label: 'Bezpieczenstwo' },
  { id: 'business-outline', label: 'Uslugi publiczne' },
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
