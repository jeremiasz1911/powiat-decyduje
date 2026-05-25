import { Box, Text, VStack } from '@gluestack-ui/themed';
import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { auth, db, firebaseApp, isFirebaseConfigured } from '@/src/lib/firebase';
import { futuristicTheme } from '@/src/theme/futuristic';

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Box style={styles.row}>
      <Text color={futuristicTheme.colors.textMuted}>{label}</Text>
      <Text color={futuristicTheme.colors.textPrimary} fontWeight="$bold">
        {value}
      </Text>
    </Box>
  );
}

function maskSecret(value: string | undefined): string {
  if (!value) {
    return 'brak';
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}...${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export default function DiagnosticsScreen() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  const appName = firebaseApp?.name ?? 'brak';

  return (
    <ScreenContainer title="Diagnostyka" description="Podstawowe statusy konfiguracji Firebase.">
      <VStack space="md">
        <Box style={styles.panel}>
          <VStack space="xs">
            <InfoRow label="API key" value={maskSecret(apiKey)} />
            <InfoRow label="Project ID" value={projectId ? 'true' : 'false'} />
            <InfoRow label="App ID" value={appId ? 'true' : 'false'} />
            <InfoRow label="Firebase configured" value={isFirebaseConfigured ? 'true' : 'false'} />
            <InfoRow label="firebaseApp.name" value={appName} />
            <InfoRow label="Auth instance" value={auth ? 'true' : 'false'} />
            <InfoRow label="Firestore instance" value={db ? 'true' : 'false'} />
          </VStack>
        </Box>
      </VStack>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 16,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
