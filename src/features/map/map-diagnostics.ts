import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { envFlags } from '@/src/config/env';

export type MapDiagnostics = {
  platform: string;
  envKeyPresent: boolean;
  nativeKeyEmbedded: boolean;
  nativeKeySuffix: string | null;
  packageName: string | null;
  mapReadyHint: string;
};

function readNativeMapsKey(): string | null {
  const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  const iosKey = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
  const key = typeof androidKey === 'string' ? androidKey : typeof iosKey === 'string' ? iosKey : null;
  return key?.trim() || null;
}

export function isGoogleMapsConfiguredAtBuildTime(): boolean {
  const extra = Constants.expoConfig?.extra as { googleMapsConfigured?: boolean } | undefined;
  if (typeof extra?.googleMapsConfigured === 'boolean') {
    return extra.googleMapsConfigured;
  }
  return Boolean(readNativeMapsKey());
}

export function getMapDiagnostics(): MapDiagnostics {
  const nativeKey = readNativeMapsKey();
  const nativeKeyEmbedded = Boolean(nativeKey);
  const packageName = Constants.expoConfig?.android?.package ?? null;

  let mapReadyHint = 'Oczekiwanie na onMapReady…';
  if (!envFlags.googleMapsApiKey) {
    mapReadyHint = 'Brak EXPO_PUBLIC_GOOGLE_MAPS_API_KEY w .env.local — przebuduj aplikację.';
  } else if (!nativeKeyEmbedded) {
    mapReadyHint = 'Klucz nie trafił do natywnego builda — uruchom: npx expo prebuild --platform android --clean';
  } else if (Platform.OS === 'android') {
    mapReadyHint =
      'Jeśli mapa się kręci >12s: w Google Cloud dodaj SHA-1 z android/app/debug.keystore (npm run android:sha1), pakiet com.jeremiasz1911.powiatdecyduje, włącz Maps SDK for Android i billing.';
  }

  return {
    platform: Platform.OS,
    envKeyPresent: envFlags.googleMapsApiKey,
    nativeKeyEmbedded,
    nativeKeySuffix: nativeKey ? nativeKey.slice(-6) : null,
    packageName,
    mapReadyHint,
  };
}

export function logMapDiagnostics(context: string): void {
  const d = getMapDiagnostics();
  console.log(`[MapDiagnostics:${context}]`, {
    platform: d.platform,
    envKeyPresent: d.envKeyPresent,
    nativeKeyEmbedded: d.nativeKeyEmbedded,
    nativeKeySuffix: d.nativeKeySuffix,
    packageName: d.packageName,
    hint: d.mapReadyHint,
  });
}
