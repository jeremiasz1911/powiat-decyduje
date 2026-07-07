import { StyleSheet } from 'react-native';

export const lightAppColors = {
  background: '#FFFFFF',
  backgroundSoft: '#FFF7F7',
  backgroundCherry: '#FFF1F3',
  surface: '#FFFFFF',
  surfaceSoft: '#FFFAFA',
  primary: '#E30613',
  primaryStrong: '#C40010',
  primarySoft: 'rgba(227, 6, 19, 0.08)',
  cherry: '#F8B4C4',
  cherrySoft: 'rgba(248, 180, 196, 0.22)',
  cherryLine: 'rgba(227, 6, 19, 0.12)',
  textPrimary: '#171D2B',
  textSecondary: '#374151',
  textMuted: '#8A8F9B',
  textOnPrimary: '#FFFFFF',
  border: 'rgba(23, 29, 43, 0.10)',
  borderStrong: 'rgba(227, 6, 19, 0.22)',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  placeholder: '#9CA3AF',
} as const;

export const darkAppColors = {
  background: '#0F1115',
  backgroundSoft: '#171B24',
  backgroundCherry: '#1C1418',
  surface: '#171B24',
  surfaceSoft: '#1F2430',
  primary: '#FF4D57',
  primaryStrong: '#E30613',
  primarySoft: 'rgba(255, 77, 87, 0.14)',
  cherry: '#8F4D62',
  cherrySoft: 'rgba(143, 77, 98, 0.24)',
  cherryLine: 'rgba(255, 77, 87, 0.18)',
  textPrimary: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 77, 87, 0.28)',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  placeholder: '#6B7280',
} as const;

export type AppColorTokens = {
  [K in keyof typeof lightAppColors]: string;
};

/** @deprecated Prefer useAppTheme().colors in components that should react to theme changes. */
export const appColors = lightAppColors;

export const appTheme = {
  colors: {
    ...appColors,
    // Backward-compatible aliases
    red: appColors.primary,
    redStrong: appColors.primaryStrong,
    redDark: appColors.primaryStrong,
    text: appColors.textPrimary,
    surfaceElevated: appColors.surface,
    bgTop: appColors.background,
    bgBottom: appColors.backgroundSoft,
    panel: appColors.surface,
    panelSoft: appColors.surfaceSoft,
    accent: appColors.primary,
    accentStrong: appColors.primaryStrong,
    textDark: appColors.textOnPrimary,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
} as const;

export const appGradients = {
  /** Jasny motyw: biały z delikatnym ciepłym „cherry” w środku (jak ciemny gradient, ale jasny). */
  screen: ['#FFFFFF', '#FFF0F3', '#FFF8F9'] as const,
};

export const appShadows = StyleSheet.create({
  card: {
    shadowColor: '#171D2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  softRed: {
    shadowColor: '#E30613',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  button: {
    shadowColor: '#E30613',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  soft: {
    shadowColor: '#171D2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 4,
  },
  glow: {
    shadowColor: '#E30613',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
});

export const formStyles = StyleSheet.create({
  card: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
    padding: appTheme.spacing.lg,
    borderWidth: 1,
    borderColor: appColors.border,
    ...appShadows.soft,
  },
  sectionTitle: {
    color: appColors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.xs,
  },
  helper: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  meta: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
