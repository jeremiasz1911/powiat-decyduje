import { type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { STORAGE_KEYS } from '@/src/constants/storage';
import { useAuth } from '@/src/hooks/use-auth';
import { clearRememberMePreference, isSessionOnlyLogin, shouldRestorePersistedSession } from '@/src/lib/remember-me';
import { secureStore } from '@/src/lib/secure-store';
import {
  getSignedInUserResidentProfile,
  logoutResidentSession,
  resolveActiveResidentAccountId,
  type ResidentAccount,
} from '@/src/services';

export type ViewerMode = 'guest' | 'authenticated';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  guestModeReady: boolean;
  viewerMode: ViewerMode;
  isGuest: boolean;
  isAuthenticated: boolean;
  canAccessPrivateFeatures: boolean;
  residentAccounts: ResidentAccount[];
  activeResidentAccount: ResidentAccount | null;
  activeResidentAccountId: string | null;
  setActiveResidentAccountId: (accountId: string, knownAccounts?: ResidentAccount[]) => Promise<void>;
  refreshResidentAccounts: (preferredActiveAccountId?: string) => Promise<ResidentAccount[]>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const [residentAccounts, setResidentAccounts] = useState<ResidentAccount[]>([]);
  const [activeResidentAccountId, setActiveResidentAccountIdState] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestModeReady, setGuestModeReady] = useState(false);
  const [rememberMeReady, setRememberMeReady] = useState(false);

  const isAuthenticated = Boolean(user && !user.isAnonymous);
  const isGuest = guestMode && !isAuthenticated;
  const viewerMode: ViewerMode = isAuthenticated ? 'authenticated' : 'guest';
  const canAccessPrivateFeatures = isAuthenticated;

  useEffect(() => {
    void secureStore.get(STORAGE_KEYS.guestMode).then((value) => {
      setGuestMode(value === 'true');
      setGuestModeReady(true);
    });
  }, []);

  const exitGuestMode = useCallback(async () => {
    setGuestMode(false);
    await secureStore.remove(STORAGE_KEYS.guestMode);
  }, []);

  const enterGuestMode = useCallback(async () => {
    await logoutResidentSession();
    setResidentAccounts([]);
    setActiveResidentAccountIdState(null);
    await secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
    await clearRememberMePreference();
    setGuestMode(true);
    await secureStore.set(STORAGE_KEYS.guestMode, 'true');
  }, []);

  const setActiveResidentAccountId = useCallback(
    async (accountId: string, knownAccounts?: ResidentAccount[]) => {
      let accountsToCheck = knownAccounts ?? residentAccounts;

      if (!accountsToCheck.some((account) => account.id === accountId)) {
        const profile = await getSignedInUserResidentProfile();
        accountsToCheck = profile.accounts;
        if (profile.accounts.length > 0) {
          setResidentAccounts(profile.accounts);
        }
      }

      if (!accountsToCheck.some((account) => account.id === accountId)) {
        throw new Error('Wybrane konto mieszkanca nie jest dostepne.');
      }

      setActiveResidentAccountIdState(accountId);
      await secureStore.set(STORAGE_KEYS.activeResidentAccountId, accountId);
    },
    [residentAccounts]
  );

  const refreshResidentAccounts = useCallback(
    async (preferredActiveAccountId?: string): Promise<ResidentAccount[]> => {
      setAccountsLoading(true);
      try {
        const profile = await getSignedInUserResidentProfile();
        const accounts = profile.accounts;
        setResidentAccounts(accounts);

        if (!accounts.length) {
          setActiveResidentAccountIdState(null);
          await secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
          return [];
        }

        const persisted = await secureStore.get(STORAGE_KEYS.activeResidentAccountId);
        const nextActiveId = resolveActiveResidentAccountId(accounts, [
          preferredActiveAccountId,
          profile.activeResidentAccountId,
          persisted,
        ]);

        if (nextActiveId) {
          setActiveResidentAccountIdState(nextActiveId);
          await secureStore.set(STORAGE_KEYS.activeResidentAccountId, nextActiveId);
        }

        return accounts;
      } finally {
        setAccountsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
    await secureStore.remove(STORAGE_KEYS.guestMode);
    await clearRememberMePreference();
    setActiveResidentAccountIdState(null);
    setResidentAccounts([]);
    setGuestMode(false);
    await logoutResidentSession();
  }, []);

  useEffect(() => {
    if (loading || !guestModeReady) {
      return;
    }

    let cancelled = false;

    const enforceRememberMe = async () => {
      if (user && !user.isAnonymous) {
        const shouldRestore = await shouldRestorePersistedSession();

        if (!shouldRestore && !isSessionOnlyLogin()) {
          setResidentAccounts([]);
          setActiveResidentAccountIdState(null);
          await secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
          await secureStore.remove(STORAGE_KEYS.guestMode);
          setGuestMode(false);
          await logoutResidentSession();
        }
      }

      if (!cancelled) {
        setRememberMeReady(true);
      }
    };

    void enforceRememberMe();

    return () => {
      cancelled = true;
    };
  }, [guestModeReady, loading, user]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isAuthenticated) {
      void exitGuestMode();
      void refreshResidentAccounts();
      return;
    }

    setResidentAccounts([]);
    setActiveResidentAccountIdState(null);
    void secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
  }, [exitGuestMode, isAuthenticated, loading, refreshResidentAccounts]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: loading || accountsLoading || !guestModeReady || !rememberMeReady,
      guestModeReady,
      viewerMode,
      isGuest,
      isAuthenticated,
      canAccessPrivateFeatures,
      residentAccounts,
      activeResidentAccountId,
      activeResidentAccount:
        residentAccounts.find((account) => account.id === activeResidentAccountId) ?? null,
      setActiveResidentAccountId,
      refreshResidentAccounts,
      enterGuestMode,
      exitGuestMode,
      logout,
    }),
    [
      activeResidentAccountId,
      accountsLoading,
      canAccessPrivateFeatures,
      enterGuestMode,
      exitGuestMode,
      guestModeReady,
      isAuthenticated,
      isGuest,
      loading,
      rememberMeReady,
      refreshResidentAccounts,
      residentAccounts,
      setActiveResidentAccountId,
      logout,
      user,
      viewerMode,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider.');
  }

  return context;
}
