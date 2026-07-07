import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PowiatStartAnimation } from '@/src/components/brand/PowiatStartAnimation';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';
import { useBootstrapTheme } from '@/src/theme/use-bootstrap-theme';

const LEAVE_TRANSITION_MS = 380;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useBootstrapTheme();
  const [introFinished, setIntroFinished] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (__DEV__) {
      console.log('Onboarding screen mounted');
    }

    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const handleIntroFinish = useCallback(() => {
    if (__DEV__) {
      console.log('Onboarding intro finished');
    }
    setIntroFinished(true);
  }, []);

  const handleStart = useCallback(() => {
    if (isLeaving) return;

    setIsLeaving(true);

    leaveTimerRef.current = setTimeout(async () => {
      await secureStore.set(STORAGE_KEYS.onboardingCompleted, 'true');
      router.replace('/login-phone');
    }, LEAVE_TRANSITION_MS);
  }, [isLeaving, router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PowiatStartAnimation
        onFinish={handleIntroFinish}
        introFinished={introFinished}
        isLeaving={isLeaving}
        onStartPress={handleStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
