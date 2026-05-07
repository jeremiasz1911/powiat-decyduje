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

type AuthFlowContextValue = {
  pendingRegistration: PendingRegistration | null;
  pendingPasswordLogin: PendingPasswordLogin | null;
  beginRegistration: (payload: ResidentRegistrationFormValues, verificationId: string) => void;
  consumeRegistration: () => PendingRegistration | null;
  beginPasswordLogin: (payload: PendingPasswordLogin) => void;
  consumePasswordLogin: () => PendingPasswordLogin | null;
  clearFlow: () => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: PropsWithChildren) {
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [pendingPasswordLogin, setPendingPasswordLogin] = useState<PendingPasswordLogin | null>(null);

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

  const clearFlow = useCallback(() => {
    setPendingRegistration(null);
    setPendingPasswordLogin(null);
  }, []);

  const value = useMemo<AuthFlowContextValue>(
    () => ({
      pendingRegistration,
      pendingPasswordLogin,
      beginRegistration,
      consumeRegistration,
      beginPasswordLogin,
      consumePasswordLogin,
      clearFlow,
    }),
    [
      beginPasswordLogin,
      beginRegistration,
      clearFlow,
      consumePasswordLogin,
      consumeRegistration,
      pendingPasswordLogin,
      pendingRegistration,
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
