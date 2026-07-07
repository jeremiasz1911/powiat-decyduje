import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';

import { useSettings, type ThemePreference } from '@/src/store/settings-context';
import {
  appGradients,
  appShadows,
  appTheme as baseAppTheme,
  darkAppColors,
  lightAppColors,
  type AppColorTokens,
} from '@/src/theme/app-theme';

export type ResolvedColorScheme = 'light' | 'dark';

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName
): ResolvedColorScheme {
  if (preference === 'dark') {
    return 'dark';
  }

  if (preference === 'light') {
    return 'light';
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}

type AppThemeContextValue = {
  colors: AppColorTokens;
  colorScheme: ResolvedColorScheme;
  theme: typeof baseAppTheme & { colors: AppColorTokens };
  gradients: {
    screen: readonly [string, string, ...string[]];
  };
  shadows: typeof appShadows;
};

const ThemeContext = createContext<AppThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  const value = useMemo<AppThemeContextValue>(() => {
    const colorScheme = resolveColorScheme(settings.theme, systemScheme);
    const colors = colorScheme === 'dark' ? darkAppColors : lightAppColors;
    const gradients =
      colorScheme === 'dark'
        ? (['#0F1115', '#171B24', '#0F1115'] as const)
        : (['#FFFFFF', '#FFF0F3', '#FFF8F9'] as const);

    return {
      colorScheme,
      colors,
      gradients: { screen: gradients },
      shadows: appShadows,
      theme: {
        ...baseAppTheme,
        colors: {
          ...colors,
          red: colors.primary,
          redStrong: colors.primaryStrong,
          redDark: colors.primaryStrong,
          text: colors.textPrimary,
          surfaceElevated: colors.surface,
          bgTop: colors.background,
          bgBottom: colors.backgroundSoft,
          panel: colors.surface,
          panelSoft: colors.surfaceSoft,
          accent: colors.primary,
          accentStrong: colors.primaryStrong,
          textDark: colors.textOnPrimary,
        },
      },
    };
  }, [settings.theme, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    const colors = lightAppColors;

    return {
      colorScheme: 'light',
      colors,
      gradients: { screen: appGradients.screen },
      shadows: appShadows,
      theme: {
        ...baseAppTheme,
        colors: {
          ...colors,
          red: colors.primary,
          redStrong: colors.primaryStrong,
          redDark: colors.primaryStrong,
          text: colors.textPrimary,
          surfaceElevated: colors.surface,
          bgTop: colors.background,
          bgBottom: colors.backgroundSoft,
          panel: colors.surface,
          panelSoft: colors.surfaceSoft,
          accent: colors.primary,
          accentStrong: colors.primaryStrong,
          textDark: colors.textOnPrimary,
        },
      },
    };
  }

  return context;
}
