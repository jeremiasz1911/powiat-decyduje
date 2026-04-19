import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { type User } from 'firebase/auth';

import { STORAGE_KEYS } from '@/src/constants/storage';
import { useAuth } from '@/src/hooks/use-auth';
import { secureStore } from '@/src/lib/secure-store';
import { getResidentAccountsForSignedInUser, type ResidentAccount } from '@/src/services';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  residentAccounts: ResidentAccount[];
  activeResidentAccount: ResidentAccount | null;
  activeResidentAccountId: string | null;
  setActiveResidentAccountId: (accountId: string) => Promise<void>;
  refreshResidentAccounts: () => Promise<ResidentAccount[]>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const [residentAccounts, setResidentAccounts] = useState<ResidentAccount[]>([]);
  const [activeResidentAccountId, setActiveResidentAccountIdState] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const setActiveResidentAccountId = useCallback(
    async (accountId: string) => {
      const accountExists = residentAccounts.some((account) => account.id === accountId);
      if (!accountExists) {
        throw new Error('Wybrane konto mieszkanca nie jest dostepne.');
      }

      setActiveResidentAccountIdState(accountId);
      await secureStore.set(STORAGE_KEYS.activeResidentAccountId, accountId);
    },
    [residentAccounts]
  );

  const refreshResidentAccounts = useCallback(async (): Promise<ResidentAccount[]> => {
    if (!user) {
      setResidentAccounts([]);
      setActiveResidentAccountIdState(null);
      await secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
      return [];
    }

    setAccountsLoading(true);
    try {
      const accounts = await getResidentAccountsForSignedInUser();
      setResidentAccounts(accounts);

      if (!accounts.length) {
        setActiveResidentAccountIdState(null);
        await secureStore.remove(STORAGE_KEYS.activeResidentAccountId);
        return [];
      }

      const persisted = await secureStore.get(STORAGE_KEYS.activeResidentAccountId);
      const nextActiveId =
        persisted && accounts.some((account) => account.id === persisted) ? persisted : accounts[0].id;

      setActiveResidentAccountIdState(nextActiveId);
      await secureStore.set(STORAGE_KEYS.activeResidentAccountId, nextActiveId);
      return accounts;
    } finally {
      setAccountsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshResidentAccounts();
  }, [refreshResidentAccounts]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: loading || accountsLoading,
      isAuthenticated: Boolean(user),
      residentAccounts,
      activeResidentAccountId,
      activeResidentAccount:
        residentAccounts.find((account) => account.id === activeResidentAccountId) ?? null,
      setActiveResidentAccountId,
      refreshResidentAccounts,
    }),
    [
      activeResidentAccountId,
      accountsLoading,
      loading,
      refreshResidentAccounts,
      residentAccounts,
      setActiveResidentAccountId,
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
