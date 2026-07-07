import { useAuthContext } from '@/src/store/auth-context';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { BootstrapLoadingScreen } from '@/src/components/bootstrap-loading-screen';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';
import { useBootstrapTheme } from '@/src/theme/use-bootstrap-theme';

const FORCE_SHOW_INTRO_IN_DEV = true;
const RESET_ONBOARDING_KEY_ON_LAUNCH_IN_DEV = false;
let forcedIntroShownInCurrentSession = false;

export default function AppEntryScreen() {
  const { isAuthenticated, isGuest, loading: authLoading } = useAuthContext();
  const { settingsReady } = useBootstrapTheme();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    const checkOnboarding = async () => {
      if (__DEV__ && RESET_ONBOARDING_KEY_ON_LAUNCH_IN_DEV) {
        await secureStore.remove(STORAGE_KEYS.onboardingCompleted);
      }

      const done = await secureStore.get(STORAGE_KEYS.onboardingCompleted);
      const onboardingCompleted = done === 'true';
      const forceIntroNow = __DEV__ && FORCE_SHOW_INTRO_IN_DEV && !forcedIntroShownInCurrentSession;
      const nextShouldShowOnboarding = forceIntroNow ? true : !onboardingCompleted;

      if (forceIntroNow) {
        forcedIntroShownInCurrentSession = true;
      }

      if (__DEV__) {
        console.log('[AppEntry] onboardingCompleted:', onboardingCompleted);
        console.log('[AppEntry] forceIntroNow:', forceIntroNow);
        console.log('[AppEntry] shouldShowOnboarding:', nextShouldShowOnboarding);
      }

      setShouldShowOnboarding(nextShouldShowOnboarding);
      setOnboardingChecked(true);
    };

    void checkOnboarding();
  }, [settingsReady]);

  if (!settingsReady || !onboardingChecked || authLoading) {
    return <BootstrapLoadingScreen label="Uruchamianie aplikacji" />;
  }

  if (shouldShowOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(drawer)/(tabs)" />;
  }

  if (isGuest) {
    return <Redirect href="/(drawer)/(tabs)/map" />;
  }

  return <Redirect href="/login-phone" />;
}
