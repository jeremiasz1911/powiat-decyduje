import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react';

import { useAuthContext } from '@/src/store/auth-context';

type LoginRequiredContextValue = {
  requireAuth: (action?: () => void) => boolean;
  redirectToLogin: () => void;
};

const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);

export function LoginRequiredProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { canAccessPrivateFeatures } = useAuthContext();

  const redirectToLogin = useCallback(() => {
    router.push('/login-phone');
  }, [router]);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (canAccessPrivateFeatures) {
        action?.();
        return true;
      }

      redirectToLogin();
      return false;
    },
    [canAccessPrivateFeatures, redirectToLogin]
  );

  const value = useMemo(
    () => ({
      requireAuth,
      redirectToLogin,
    }),
    [redirectToLogin, requireAuth]
  );

  return <LoginRequiredContext.Provider value={value}>{children}</LoginRequiredContext.Provider>;
}

export function useRequireAuth(): LoginRequiredContextValue {
  const context = useContext(LoginRequiredContext);

  if (!context) {
    throw new Error('useRequireAuth must be used within LoginRequiredProvider.');
  }

  return context;
}
