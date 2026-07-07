import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuthContext } from '@/src/store/auth-context';

export default function LoginEntryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        router.replace('/(drawer)/(tabs)');
        return;
      }

      router.push('/login-phone');
    }, [isAuthenticated, router])
  );

  return null;
}
