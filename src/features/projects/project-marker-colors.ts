import { appColors } from '@/src/theme/app-theme';

export const PROJECT_MARKER_COLORS = [
  { id: '#E30613', label: 'Czerwień' },
  { id: '#2563EB', label: 'Niebieski' },
  { id: '#16A34A', label: 'Zieleń' },
  { id: '#D97706', label: 'Pomarańcz' },
  { id: '#7C3AED', label: 'Fiolet' },
  { id: '#0891B2', label: 'Turkus' },
  { id: '#DB2777', label: 'Róż' },
  { id: '#4B5563', label: 'Grafit' },
] as const;

export type ProjectMarkerColorId = (typeof PROJECT_MARKER_COLORS)[number]['id'];

export const DEFAULT_PROJECT_MARKER_COLOR: ProjectMarkerColorId = appColors.primary;

const COLOR_SET = new Set<string>(PROJECT_MARKER_COLORS.map((option) => option.id));

export function isProjectMarkerColor(value: string): value is ProjectMarkerColorId {
  return COLOR_SET.has(value);
}

export function resolveProjectMarkerColor(value?: string | null): string {
  if (value && isProjectMarkerColor(value)) {
    return value;
  }

  if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value.toUpperCase();
  }

  return DEFAULT_PROJECT_MARKER_COLOR;
}
