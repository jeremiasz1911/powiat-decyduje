import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';

let sessionOnlyLoginActive = false;

export function markSessionOnlyLogin(): void {
  sessionOnlyLoginActive = true;
}

export function markPersistentLogin(): void {
  sessionOnlyLoginActive = false;
}

export function isSessionOnlyLogin(): boolean {
  return sessionOnlyLoginActive;
}

export async function getRememberMePreference(): Promise<boolean> {
  const value = await secureStore.get(STORAGE_KEYS.rememberMe);
  return value !== 'false';
}

export async function setRememberMePreference(remember: boolean): Promise<void> {
  if (remember) {
    await secureStore.set(STORAGE_KEYS.rememberMe, 'true');
    return;
  }

  await secureStore.set(STORAGE_KEYS.rememberMe, 'false');
}

export async function clearRememberMePreference(): Promise<void> {
  sessionOnlyLoginActive = false;
  await secureStore.remove(STORAGE_KEYS.rememberMe);
}

export async function shouldRestorePersistedSession(): Promise<boolean> {
  const value = await secureStore.get(STORAGE_KEYS.rememberMe);
  return value !== 'false';
}
