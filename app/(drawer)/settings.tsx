import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import {
  SettingsCard,
  SettingsCheckRow,
  SettingsGroup,
  SettingsRow,
  SettingsSwitchRow,
} from '@/src/components/settings/settings-ui';
import { envFlags } from '@/src/config/env';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { usePrivateRoute } from '@/src/hooks/use-private-route';
import { secureStore } from '@/src/lib/secure-store';
import { useAuthContext } from '@/src/store/auth-context';
import { useSettings, type FontScalePreference, type ThemePreference } from '@/src/store/settings-context';
import { appTheme } from '@/src/theme/app-theme';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Systemowy',
  light: 'Jasny',
  dark: 'Ciemny',
};

const FONT_SCALE_LABELS: Record<FontScalePreference, string> = {
  normal: 'Normalny',
  large: 'Wiekszy',
  xlarge: 'Bardzo duzy',
};

export default function DrawerSettingsScreen() {
  const router = useRouter();
  const canAccessPrivateFeatures = usePrivateRoute();
  const { activeResidentAccount } = useAuthContext();
  const [isResetting, setIsResetting] = useState(false);
  const { settings, setFontScale, setHapticsEnabled, setTheme } = useSettings();
  const showDiagnostics = __DEV__ || envFlags.diagnosticsEnabled;

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    await secureStore.remove(STORAGE_KEYS.onboardingCompleted);
    router.replace('/onboarding');
  };

  const themes: ThemePreference[] = ['system', 'light', 'dark'];
  const fontScales: FontScalePreference[] = ['normal', 'large', 'xlarge'];

  if (!canAccessPrivateFeatures) {
    return null;
  }

  return (
    <ScreenContainer title="Ustawienia" description="Wygląd, dostępność i pomoc.">
      <View style={styles.sections}>
        <SettingsGroup
          title="Wygląd"
          footer="Motyw wpływa na kolorystykę interfejsu aplikacji.">
          <SettingsCard>
            {themes.map((theme) => (
              <SettingsCheckRow
                key={theme}
                label={THEME_LABELS[theme]}
                selected={settings.theme === theme}
                onPress={() => void setTheme(theme)}
                icon={
                  theme === 'system'
                    ? 'phone-portrait-outline'
                    : theme === 'light'
                      ? 'sunny-outline'
                      : 'moon-outline'
                }
              />
            ))}
          </SettingsCard>
        </SettingsGroup>

        <SettingsGroup
          title="Dostępność"
          footer="Większy tekst ułatwia czytanie treści w całej aplikacji.">
          <SettingsCard>
            {fontScales.map((fontScale) => (
              <SettingsCheckRow
                key={fontScale}
                label={FONT_SCALE_LABELS[fontScale]}
                selected={settings.fontScale === fontScale}
                onPress={() => void setFontScale(fontScale)}
                icon="text-outline"
              />
            ))}
            <SettingsSwitchRow
              label="Wibracje"
              icon="phone-portrait-outline"
              value={settings.hapticsEnabled}
              onValueChange={(value) => void setHapticsEnabled(value)}
            />
          </SettingsCard>
        </SettingsGroup>

        <SettingsGroup title="Pomoc">
          <SettingsCard>
            <SettingsRow
              label="Uruchom onboarding ponownie"
              icon="refresh-outline"
              onPress={() => void handleResetOnboarding()}
              loading={isResetting}
              showChevron
            />
          </SettingsCard>
        </SettingsGroup>

        {showDiagnostics ? (
          <SettingsGroup title="Diagnostyka" footer="Narzedzia deweloperskie i informacje o konfiguracji.">
            <SettingsCard>
              <SettingsRow
                label="Otworz diagnostyke"
                icon="bug-outline"
                onPress={() => router.push('/(drawer)/diagnostics')}
                showChevron
              />
            </SettingsCard>
          </SettingsGroup>
        ) : null}

        <SettingsGroup title="Konto" footer="Zarządzanie profilem i sesją w sekcji Profil.">
          <SettingsCard>
            <SettingsRow
              label="Profil mieszkańca"
              icon="person-outline"
              value={activeResidentAccount?.label ?? 'Brak'}
              onPress={() => router.push('/(drawer)/profile')}
              showChevron
            />
          </SettingsCard>
        </SettingsGroup>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: appTheme.spacing.lg,
  },
});
