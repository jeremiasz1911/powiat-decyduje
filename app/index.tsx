import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/src/store/auth-context';

import { secureStore } from '@/src/lib/secure-store';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { futuristicTheme } from '@/src/theme/futuristic';

export default function AppEntryScreen() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const done = await secureStore.get(STORAGE_KEYS.onboardingCompleted);
      setCompleted(done === 'true');
      setLoading(false);
    };

    void checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={futuristicTheme.colors.accent} />
      </View>
    );
  }

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  if (!user) {
    return <Redirect href="/login-phone" />;
  }

  return <Redirect href="/(drawer)/(tabs)/projects" />;
}
