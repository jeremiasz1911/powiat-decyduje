import { StatusBar } from 'expo-status-bar';

import { useAppTheme } from '@/src/theme/theme-context';

export function ThemeStatusBar() {
  const { colorScheme } = useAppTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}
