import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';
import Constants from 'expo-constants';
import { Platform, StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { envFlags } from '@/src/config/env';
import { auth, getFirebaseDiagnostics } from '@/src/lib/firebase';
import { futuristicTheme } from '@/src/theme/futuristic';

const formatBool = (value: boolean) => (value ? 'tak' : 'nie');

export default function DiagnosticsScreen() {
  const firebase = getFirebaseDiagnostics();
  const user = auth?.currentUser ?? null;
  const providers = user?.providerData?.map((provider) => provider.providerId).filter(Boolean) ?? [];
  const expoConfig = Constants.expoConfig;

  return (
    <ScreenContainer title="Diagnostyka" description="Podglad konfiguracji (bez sekretow).">
      <VStack space="md">
        <Box style={styles.panel}>
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Aplikacja</Heading>
          <Text color={futuristicTheme.colors.textMuted}>Platforma: {Platform.OS}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Wersja: {expoConfig?.version ?? '-'}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Build profile: {envFlags.buildProfile ?? '-'}</Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Firebase</Heading>
          <Text color={futuristicTheme.colors.textMuted}>SDK: {firebase.sdk}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Skonfigurowany: {formatBool(firebase.configured)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Project ID: {firebase.projectId ?? '-'}</Text>
          <Text color={futuristicTheme.colors.textMuted}>App ID: {firebase.appId ?? '-'}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Auth gotowy: {formatBool(firebase.authReady)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Firestore gotowy: {formatBool(firebase.firestoreReady)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Functions gotowe: {formatBool(firebase.functionsReady)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Storage gotowy: {formatBool(firebase.storageReady)}</Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Zmienne EXPO_PUBLIC</Heading>
          <Text color={futuristicTheme.colors.textMuted}>API key: {formatBool(envFlags.firebaseApiKey)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Auth domain: {formatBool(envFlags.firebaseAuthDomain)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Project ID: {formatBool(envFlags.firebaseProjectId)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Storage bucket: {formatBool(envFlags.firebaseStorageBucket)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Messaging sender: {formatBool(envFlags.firebaseMessagingSenderId)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>App ID: {formatBool(envFlags.firebaseAppId)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Database URL: {formatBool(envFlags.firebaseDatabaseUrl)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Measurement ID: {formatBool(envFlags.firebaseMeasurementId)}</Text>
          <Text color={futuristicTheme.colors.textMuted}>Maps API key: {formatBool(envFlags.googleMapsApiKey)}</Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Auth</Heading>
          <Text color={futuristicTheme.colors.textMuted}>Zalogowany: {formatBool(Boolean(user))}</Text>
          <Text color={futuristicTheme.colors.textMuted}>
            Providerzy: {providers.length ? providers.join(', ') : '-'}
          </Text>
          <Text color={futuristicTheme.colors.textMuted}>
            UID (skrocony): {user?.uid ? `${user.uid.slice(0, 6)}…${user.uid.slice(-4)}` : '-'}
          </Text>
        </Box>

        <Box style={styles.panel}>
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Android</Heading>
          <Text color={futuristicTheme.colors.textMuted}>
            googleServicesFile: {expoConfig?.android?.googleServicesFile ?? '-'}
          </Text>
          <Text color={futuristicTheme.colors.textMuted}>
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
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
});
