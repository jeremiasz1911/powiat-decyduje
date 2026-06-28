import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { envFlags } from '@/src/config/env';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type MapConfigNoticeProps = {
  variant?: 'missingKey' | 'loadFailed';
};

function isGoogleMapsConfiguredAtBuildTime(): boolean {
  const extra = Constants.expoConfig?.extra as { googleMapsConfigured?: boolean } | undefined;
  if (typeof extra?.googleMapsConfigured === 'boolean') {
    return extra.googleMapsConfigured;
  }

  const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  const iosKey = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
  return Boolean(androidKey || iosKey);
}

export function MapConfigNotice({ variant = 'missingKey' }: MapConfigNoticeProps) {
  if (Platform.OS === 'web') {
    return null;
  }

  const configured = envFlags.googleMapsApiKey && isGoogleMapsConfiguredAtBuildTime();

  if (variant === 'missingKey') {
    if (configured) {
      return null;
    }

    return (
      <View style={styles.wrap} pointerEvents="none">
        <View style={styles.card}>
          <Text style={styles.title}>Mapa Google jest niedostępna</Text>
          <Text style={styles.text}>
            Brak klucza Google Maps w buildzie natywnym. Dodaj{' '}
            <Text style={styles.code}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY</Text> do pliku{' '}
            <Text style={styles.code}>.env.local</Text>, włącz Maps SDK for Android w Google Cloud,
            a następnie przebuduj aplikację:
          </Text>
          <Text style={styles.command}>npx expo prebuild --platform android --clean{'\n'}npx expo run:android</Text>
        </View>
      </View>
    );
  }

  if (!configured) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.title}>Mapa nie mogła się załadować</Text>
        <Text style={styles.text}>
          Klucz Google Maps jest w aplikacji, ale kafelki mapy nie odpowiadają. Sprawdź w Google Cloud
          Console, czy włączone są Maps SDK for Android oraz czy klucz ma poprawne ograniczenia (pakiet
          aplikacji i SHA-1 certyfikatu).
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    zIndex: 20,
  },
  card: {
    maxWidth: 360,
    gap: appTheme.spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: appTheme.spacing.lg,
    ...appShadows.soft,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  text: {
    color: appColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: appColors.textPrimary,
    fontWeight: '700',
  },
  command: {
    marginTop: appTheme.spacing.xs,
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});
