import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { ResidentRegistrationFormValues } from '@/src/features/auth/resident-registration.schema';
import type { ResidentAccount } from '@/src/services';

type PendingRegistration = ResidentRegistrationFormValues & {
  verificationId: string;
  normalizedPhoneNumber: string;
};

type PendingPasswordLogin = {
  identifier: string;
  password: string;
  email: string;
  residentAccounts: ResidentAccount[];
};

type PendingPhoneLogin = {
  phoneNumber: string;
  verificationId: string;
  residentAccounts: ResidentAccount[];
  selectedResidentAccountId: string | null;
  expiresAt: number;
  createdAt: number;
  resendCount: number;
};

type AuthFlowContextValue = {
  pendingRegistration: PendingRegistration | null;
  pendingPasswordLogin: PendingPasswordLogin | null;
  pendingPhoneLogin: PendingPhoneLogin | null;
  beginRegistration: (payload: ResidentRegistrationFormValues, verificationId: string) => void;
  consumeRegistration: () => PendingRegistration | null;
  beginPasswordLogin: (payload: PendingPasswordLogin) => void;
  consumePasswordLogin: () => PendingPasswordLogin | null;
  beginPhoneLogin: (payload: Omit<PendingPhoneLogin, 'selectedResidentAccountId' | 'createdAt' | 'resendCount'>) => void;
  setPhoneLoginSelectedAccount: (accountId: string) => void;
  incrementPhoneLoginResendCount: () => void;
  consumePhoneLogin: () => PendingPhoneLogin | null;
  clearFlow: () => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: PropsWithChildren) {
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [pendingPasswordLogin, setPendingPasswordLogin] = useState<PendingPasswordLogin | null>(null);
  const [pendingPhoneLogin, setPendingPhoneLogin] = useState<PendingPhoneLogin | null>(null);

  const beginRegistration = useCallback(
    (payload: ResidentRegistrationFormValues, verificationId: string) => {
      setPendingRegistration({
        ...payload,
        verificationId,
        normalizedPhoneNumber: payload.phoneNumber,
      });
    },
    []
  );

  const consumeRegistration = useCallback(() => {
    const next = pendingRegistration;
    setPendingRegistration(null);
    return next;
  }, [pendingRegistration]);

  const beginPasswordLogin = useCallback((payload: PendingPasswordLogin) => {
    setPendingPasswordLogin(payload);
  }, []);

  const consumePasswordLogin = useCallback(() => {
    const next = pendingPasswordLogin;
    setPendingPasswordLogin(null);
    return next;
  }, [pendingPasswordLogin]);

  const beginPhoneLogin = useCallback(
    (payload: Omit<PendingPhoneLogin, 'selectedResidentAccountId' | 'createdAt' | 'resendCount'>) => {
      setPendingPhoneLogin({
        ...payload,
        selectedResidentAccountId: null,
        createdAt: Date.now(),
        resendCount: 0,
      });
    },
    []
  );

  const setPhoneLoginSelectedAccount = useCallback((accountId: string) => {
    setPendingPhoneLogin((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        selectedResidentAccountId: accountId,
      };
    });
  }, []);

  const incrementPhoneLoginResendCount = useCallback(() => {
    setPendingPhoneLogin((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        resendCount: prev.resendCount + 1,
      };
    });
  }, []);

  const consumePhoneLogin = useCallback(() => {
    const next = pendingPhoneLogin;
    setPendingPhoneLogin(null);
    return next;
  }, [pendingPhoneLogin]);

  const clearFlow = useCallback(() => {
    setPendingRegistration(null);
    setPendingPasswordLogin(null);
    setPendingPhoneLogin(null);
  }, []);

  const value = useMemo<AuthFlowContextValue>(
    () => ({
      pendingRegistration,
      pendingPasswordLogin,
      pendingPhoneLogin,
      beginRegistration,
      consumeRegistration,
      beginPasswordLogin,
      consumePasswordLogin,
      beginPhoneLogin,
      setPhoneLoginSelectedAccount,
      incrementPhoneLoginResendCount,
      consumePhoneLogin,
      clearFlow,
    }),
    [
      beginPasswordLogin,
      beginPhoneLogin,
      beginRegistration,
      clearFlow,
      consumePasswordLogin,
      consumePhoneLogin,
      consumeRegistration,
      incrementPhoneLoginResendCount,
      pendingPasswordLogin,
      pendingPhoneLogin,
      pendingRegistration,
      setPhoneLoginSelectedAccount,
    ]
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);

  if (!context) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider.');
  }

  return context;
}
