import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import {
  normalizePhoneInput,
  type ResidentRegistrationFormValues,
} from '@/src/features/auth/resident-registration.schema';

type PendingRegistration = ResidentRegistrationFormValues & {
  verificationId: string;
  normalizedPhoneNumber: string;
};

type AuthFlowContextValue = {
  pendingRegistration: PendingRegistration | null;
  beginRegistration: (payload: ResidentRegistrationFormValues, verificationId: string) => void;
  consumeRegistration: () => PendingRegistration | null;
  updateRegistrationVerificationId: (verificationId: string) => void;
  clearFlow: () => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: PropsWithChildren) {
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

  const beginRegistration = useCallback(
    (payload: ResidentRegistrationFormValues, verificationId: string) => {
      setPendingRegistration({
        ...payload,
        verificationId,
        normalizedPhoneNumber: normalizePhoneInput(payload.phoneNumber),
      });
    },
    []
  );

  const consumeRegistration = useCallback(() => {
    const next = pendingRegistration;
    setPendingRegistration(null);
    return next;
  }, [pendingRegistration]);

  const updateRegistrationVerificationId = useCallback((verificationId: string) => {
    setPendingRegistration((current) => (current ? { ...current, verificationId } : current));
  }, []);

  const clearFlow = useCallback(() => {
    setPendingRegistration(null);
  }, []);

  const value = useMemo<AuthFlowContextValue>(
    () => ({
      pendingRegistration,
      beginRegistration,
      consumeRegistration,
      updateRegistrationVerificationId,
      clearFlow,
    }),
    [beginRegistration, clearFlow, consumeRegistration, pendingRegistration, updateRegistrationVerificationId]
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
