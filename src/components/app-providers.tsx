import { PropsWithChildren } from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';

import { gluestackConfig } from '@/src/theme/gluestack-ui.config';

export function AppProviders({ children }: PropsWithChildren) {
  return <GluestackUIProvider config={gluestackConfig}>{children}</GluestackUIProvider>;
}
