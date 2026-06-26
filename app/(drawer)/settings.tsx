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
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
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
  const { notify } = useAppFeedback();
  const { activeResidentAccount, logout } = useAuthContext();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { settings, setFontScale, setHapticsEnabled, setTheme } = useSettings();
  const showDiagnostics = __DEV__ || envFlags.diagnosticsEnabled;

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    await secureStore.remove(STORAGE_KEYS.onboardingCompleted);
    router.replace('/onboarding');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      await notify('Wylogowano', 'Wylogowano z konta mieszkanca.', 'success');
      router.replace('/login-phone');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie wylogowac.';
      await notify('Blad wylogowania', message, 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const themes: ThemePreference[] = ['system', 'light', 'dark'];
  const fontScales: FontScalePreference[] = ['normal', 'large', 'xlarge'];

  return (
    <ScreenContainer title="Ustawienia" description="Wyglad, dostepnosc i konto.">
      <View style={styles.sections}>
        <SettingsGroup
          title="Wyglad"
          footer="Motyw wplywa na kolorystyke interfejsu aplikacji.">
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
          title="Dostepnosc"
          footer="Wiekszy tekst ulatwia czytanie tresci w calej aplikacji.">
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

        <SettingsGroup
          title="Konto"
          footer={`Aktywny profil: ${activeResidentAccount?.label ?? 'brak wybranego'}`}>
          <SettingsCard>
            <SettingsRow
              label="Profil mieszkanca"
              icon="person-outline"
              value={activeResidentAccount?.label ?? 'Brak'}
            />
            <SettingsRow
              label="Zmien profil"
              icon="people-outline"
              onPress={() => router.push('/select-resident-account')}
              disabled={isLoggingOut}
              showChevron
            />
            <SettingsRow
              label={isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
              icon="log-out-outline"
              onPress={() => void handleLogout()}
              destructive
              disabled={isLoggingOut}
              loading={isLoggingOut}
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
