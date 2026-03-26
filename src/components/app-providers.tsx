import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';

import { gluestackConfig } from '@/src/theme/gluestack-ui.config';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={gluestackConfig}>{children}</GluestackUIProvider>
    </SafeAreaProvider>
  );
}
