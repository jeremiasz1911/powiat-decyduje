import { type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { STORAGE_KEYS } from '@/src/constants/storage';
import { useAuth } from '@/src/hooks/use-auth';
import { secureStore } from '@/src/lib/secure-store';
import {
  getSignedInUserResidentProfile,
  logoutResidentSession,
  resolveActiveResidentAccountId,
  type ResidentAccount,
} from '@/src/services';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  residentAccounts: ResidentAccount[];
  activeResidentAccount: ResidentAccount | null;
  activeResidentAccountId: string | null;
  setActiveResidentAccountId: (accountId: string, knownAccounts?: ResidentAccount[]) => Promise<void>;
  refreshResidentAccounts: (preferredActiveAccountId?: string) => Promise<ResidentAccount[]>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const [residentAccounts, setResidentAccounts] = useState<ResidentAccount[]>([]);
  const [activeResidentAccountId, setActiveResidentAccountIdState] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);

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
    setActiveResidentAccountIdState(null);
    setResidentAccounts([]);
    await logoutResidentSession();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || user.isAnonymous) {
      setResidentAccounts([]);
      setActiveResidentAccountIdState(null);
      void secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
      return;
    }

    void refreshResidentAccounts();
  }, [loading, refreshResidentAccounts, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: loading || accountsLoading,
      isAuthenticated: Boolean(user && !user.isAnonymous),
      residentAccounts,
      activeResidentAccountId,
      activeResidentAccount:
        residentAccounts.find((account) => account.id === activeResidentAccountId) ?? null,
      setActiveResidentAccountId,
      refreshResidentAccounts,
      logout,
    }),
    [
      activeResidentAccountId,
      accountsLoading,
      loading,
      refreshResidentAccounts,
      residentAccounts,
      setActiveResidentAccountId,
      logout,
      user,
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
