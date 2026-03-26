import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { secureStore } from '@/src/lib/secure-store';
import { STORAGE_KEYS } from '@/src/constants/storage';

export default function AppEntryScreen() {
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
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(drawer)/(tabs)/projects" />;
}
