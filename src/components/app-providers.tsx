import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';

import { SettingsProvider } from '@/src/store/settings-context';
import { gluestackConfig } from '@/src/theme/gluestack-ui.config';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GluestackUIProvider config={gluestackConfig}>{children}</GluestackUIProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
