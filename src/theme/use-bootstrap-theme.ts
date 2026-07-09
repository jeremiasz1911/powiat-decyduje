import { useColorScheme } from 'react-native';

import { useSettings } from '@/src/store/settings-context';
import { darkAppColors, lightAppColors } from '@/src/theme/app-theme';
import { resolveColorScheme, type ResolvedColorScheme } from '@/src/theme/theme-context';

export function useBootstrapTheme() {
  const systemScheme = useColorScheme();
  const { settings, ready } = useSettings();

  const colorScheme: ResolvedColorScheme = resolveColorScheme(
    ready ? settings.theme : 'system',
    systemScheme
  );

  const colors = colorScheme === 'dark' ? darkAppColors : lightAppColors;

  return { colors, colorScheme, settingsReady: ready };
}
