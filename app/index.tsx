import { useAuthContext } from '@/src/store/auth-context';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';
import { appTheme } from '@/src/theme/app-theme';

const FORCE_SHOW_INTRO_IN_DEV = true;
const RESET_ONBOARDING_KEY_ON_LAUNCH_IN_DEV = false;
let forcedIntroShownInCurrentSession = false;

export default function AppEntryScreen() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
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
      setLoading(false);
    };

    void checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appTheme.colors.background }}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (shouldShowOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!user || user.isAnonymous) {
    return <Redirect href="/login-phone" />;
  }

  return <Redirect href="/(drawer)/(tabs)" />;
}
