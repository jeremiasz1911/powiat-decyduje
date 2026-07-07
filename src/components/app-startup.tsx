import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type PropsWithChildren } from 'react';

import { useSettings } from '@/src/store/settings-context';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be prevented or unavailable in some environments.
});

type AppStartupProps = PropsWithChildren;

/** Hides native splash once persisted settings (incl. theme) are loaded. */
export function AppStartup({ children }: AppStartupProps) {
  const { ready } = useSettings();

  useEffect(() => {
    if (!ready) {
      return;
    }

    void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  return children;
}
