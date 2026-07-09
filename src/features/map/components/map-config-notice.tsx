import { Platform, StyleSheet, Text, View } from 'react-native';

import { envFlags } from '@/src/config/env';
import { isGoogleMapsConfiguredAtBuildTime } from '@/src/features/map/map-diagnostics';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type MapConfigNoticeProps = {
  variant?: 'missingKey' | 'loadFailed' | 'tilesSlow';
};

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

  if (variant === 'tilesSlow') {
    if (!configured) {
      return null;
    }

    return (
      <View style={styles.wrap} pointerEvents="none">
        <View style={styles.card}>
          <Text style={styles.title}>Kafelki mapy się nie ładują</Text>
          <Text style={styles.text}>
            Widok mapy jest gotowy, ale Google nie serwuje kafelków (szary ekran / spinner na środku).
            W Google Cloud w projekcie <Text style={styles.code}>powiat-decyduje</Text> włącz{' '}
            <Text style={styles.code}>Maps SDK for Android</Text> i billing. Klucz w aplikacji kończy się na{' '}
            <Text style={styles.code}>…a6oTdA</Text> — edytuj ten sam klucz w Credentials. Na czas testu ustaw
            ograniczenia na None, potem dodaj SHA-1 z <Text style={styles.code}>npm run android:sha1</Text>.
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'loadFailed') {
    if (!configured) {
      return null;
    }

    return (
      <View style={styles.wrap} pointerEvents="none">
        <View style={styles.card}>
          <Text style={styles.title}>Mapa nie mogła się załadować</Text>
          <Text style={styles.text}>
            Klucz Google Maps jest w aplikacji, ale widok mapy nie wstał w 12 s. Najczęstsza przyczyna na
            Androidzie: zły SHA-1 w Google Cloud. Ten projekt podpisuje debug APK plikiem{' '}
            <Text style={styles.code}>android/app/debug.keystore</Text> — sprawdź fingerprint komendą{' '}
            <Text style={styles.code}>npm run android:sha1</Text> i dodaj go do ograniczeń klucza (pakiet{' '}
            <Text style={styles.code}>com.jeremiasz1911.powiatdecyduje</Text>). Upewnij się też, że włączone są
            Maps SDK for Android oraz billing w Google Cloud.
          </Text>
        </View>
      </View>
    );
  }

  return null;
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
