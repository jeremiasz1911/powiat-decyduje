import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuthContext } from '@/src/store/auth-context';

export function usePrivateRoute(): boolean {
  const router = useRouter();
  const { canAccessPrivateFeatures } = useAuthContext();

  useEffect(() => {
    if (!canAccessPrivateFeatures) {
      router.replace('/login-phone');
    }
  }, [canAccessPrivateFeatures, router]);

  return canAccessPrivateFeatures;
}
