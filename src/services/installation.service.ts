import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';

function generateInstallationId(): string {
  return `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getInstallationId(): Promise<string> {
  const existingId = await secureStore.get(STORAGE_KEYS.installationId);

  if (existingId) {
    return existingId;
  }

  const newId = generateInstallationId();
  await secureStore.set(STORAGE_KEYS.installationId, newId);
  return newId;
}
