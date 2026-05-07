import { GluestackUIProvider } from '@gluestack-ui/themed';
import { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/src/store/auth-context';
import { AuthFlowProvider } from '@/src/store/auth-flow-context';
import { SettingsProvider } from '@/src/store/settings-context';
import { gluestackConfig } from '@/src/theme/gluestack-ui.config';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthFlowProvider>
          <SettingsProvider>
            <GluestackUIProvider config={gluestackConfig}>{children}</GluestackUIProvider>
          </SettingsProvider>
        </AuthFlowProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
