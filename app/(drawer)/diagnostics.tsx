import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';
import Constants from 'expo-constants';
import { Platform, StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { envFlags } from '@/src/config/env';
import { getMapDiagnostics } from '@/src/features/map/map-diagnostics';
import { auth, getFirebaseDiagnostics } from '@/src/lib/firebase';
import { appTheme } from '@/src/theme/app-theme';

const formatBool = (value: boolean) => (value ? 'tak' : 'nie');

export default function DiagnosticsScreen() {
  const firebase = getFirebaseDiagnostics();
  const user = auth?.currentUser ?? null;
  const providers = user?.providerData?.map((provider) => provider.providerId).filter(Boolean) ?? [];
  const expoConfig = Constants.expoConfig;
  const map = getMapDiagnostics();

  return (
    <ScreenContainer title="Diagnostyka" description="Podglad konfiguracji (bez sekretow).">
      <VStack space="md">
        <Box style={styles.panel}>
          <Heading size="sm" color={appTheme.colors.textPrimary}>Aplikacja</Heading>
          <Text color={appTheme.colors.textMuted}>Platforma: {Platform.OS}</Text>
          <Text color={appTheme.colors.textMuted}>Wersja: {expoConfig?.version ?? '-'}</Text>
          <Text color={appTheme.colors.textMuted}>Build profile: {envFlags.buildProfile ?? '-'}</Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={appTheme.colors.textPrimary}>Firebase</Heading>
          <Text color={appTheme.colors.textMuted}>SDK: {firebase.sdk}</Text>
          <Text color={appTheme.colors.textMuted}>Skonfigurowany: {formatBool(firebase.configured)}</Text>
          <Text color={appTheme.colors.textMuted}>Project ID: {firebase.projectId ?? '-'}</Text>
          <Text color={appTheme.colors.textMuted}>App ID: {firebase.appId ?? '-'}</Text>
          <Text color={appTheme.colors.textMuted}>Auth gotowy: {formatBool(firebase.authReady)}</Text>
          <Text color={appTheme.colors.textMuted}>Firestore gotowy: {formatBool(firebase.firestoreReady)}</Text>
          <Text color={appTheme.colors.textMuted}>Functions gotowe: {formatBool(firebase.functionsReady)}</Text>
          <Text color={appTheme.colors.textMuted}>Storage gotowy: {formatBool(firebase.storageReady)}</Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={appTheme.colors.textPrimary}>Zmienne EXPO_PUBLIC</Heading>
          <Text color={appTheme.colors.textMuted}>API key: {formatBool(envFlags.firebaseApiKey)}</Text>
          <Text color={appTheme.colors.textMuted}>Auth domain: {formatBool(envFlags.firebaseAuthDomain)}</Text>
          <Text color={appTheme.colors.textMuted}>Project ID: {formatBool(envFlags.firebaseProjectId)}</Text>
          <Text color={appTheme.colors.textMuted}>Storage bucket: {formatBool(envFlags.firebaseStorageBucket)}</Text>
          <Text color={appTheme.colors.textMuted}>Messaging sender: {formatBool(envFlags.firebaseMessagingSenderId)}</Text>
          <Text color={appTheme.colors.textMuted}>App ID: {formatBool(envFlags.firebaseAppId)}</Text>
          <Text color={appTheme.colors.textMuted}>Database URL: {formatBool(envFlags.firebaseDatabaseUrl)}</Text>
          <Text color={appTheme.colors.textMuted}>Measurement ID: {formatBool(envFlags.firebaseMeasurementId)}</Text>
          <Text color={appTheme.colors.textMuted}>Maps API key: {formatBool(envFlags.googleMapsApiKey)}</Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={appTheme.colors.textPrimary}>Google Maps</Heading>
          <Text color={appTheme.colors.textMuted}>Env key (.env.local): {formatBool(map.envKeyPresent)}</Text>
          <Text color={appTheme.colors.textMuted}>Klucz w buildzie natywnym: {formatBool(map.nativeKeyEmbedded)}</Text>
          <Text color={appTheme.colors.textMuted}>
            Sufiks klucza (weryfikacja): {map.nativeKeySuffix ? `…${map.nativeKeySuffix}` : '-'}
          </Text>
          <Text color={appTheme.colors.textMuted}>Package Android: {map.packageName ?? '-'}</Text>
          <Text color={appTheme.colors.textMuted}>{map.mapReadyHint}</Text>
          <Text color={appTheme.colors.textMuted}>
            Debug SHA-1: uruchom na Macu npm run android:sha1 i dodaj w Google Cloud.
          </Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={appTheme.colors.textPrimary}>Auth</Heading>
          <Text color={appTheme.colors.textMuted}>Zalogowany: {formatBool(Boolean(user))}</Text>
          <Text color={appTheme.colors.textMuted}>
            Providerzy: {providers.length ? providers.join(', ') : '-'}
          </Text>
          <Text color={appTheme.colors.textMuted}>
            UID (skrocony): {user?.uid ? `${user.uid.slice(0, 6)}…${user.uid.slice(-4)}` : '-'}
          </Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={appTheme.colors.textPrimary}>Android</Heading>
          <Text color={appTheme.colors.textMuted}>
            googleServicesFile: {expoConfig?.android?.googleServicesFile ?? '-'}
          </Text>
          <Text color={appTheme.colors.textMuted}>
            package: {expoConfig?.android?.package ?? '-'}
          </Text>
        </Box>
      </VStack>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceSoft,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
});
