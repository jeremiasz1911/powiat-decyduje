import { appColors } from './app-theme';

export const brandColors = {
  white: appColors.background,
  offWhite: appColors.backgroundSoft,
  red: appColors.primary,
  redStrong: appColors.primaryStrong,
  cherry: appColors.cherry,
  text: appColors.textPrimary,
  muted: appColors.textMuted,
  border: appColors.border,
  shadow: 'rgba(227, 6, 19, 0.18)',
} as const;
