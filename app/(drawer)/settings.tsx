import { Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { envFlags } from '@/src/config/env';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { secureStore } from '@/src/lib/secure-store';
import { useAuthContext } from '@/src/store/auth-context';
import { useSettings, type FontScalePreference, type ThemePreference } from '@/src/store/settings-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

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
    <ScreenContainer title="Settings" description="Wyglad i dostepnosc aplikacji.">
      <VStack space="md">
        <VStack space="xs">
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Motyw</Heading>
          <VStack space="xs">
            {themes.map((theme) => (
              <Button
                key={theme}
                size="sm"
                variant={settings.theme === theme ? 'solid' : 'outline'}
                action={settings.theme === theme ? 'primary' : 'secondary'}
                style={settings.theme === theme ? styles.primaryButton : styles.ghostButton}
                onPress={() => void setTheme(theme)}>
                <ButtonText color={settings.theme === theme ? futuristicTheme.colors.textDark : futuristicTheme.colors.textPrimary}>
                  {theme === 'system' ? 'Systemowy' : theme === 'light' ? 'Jasny' : 'Ciemny'}
                </ButtonText>
              </Button>
            ))}
          </VStack>
        </VStack>

        <VStack space="xs">
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Rozmiar tekstu</Heading>
          <VStack space="xs">
            {fontScales.map((fontScale) => (
              <Button
                key={fontScale}
                size="sm"
                variant={settings.fontScale === fontScale ? 'solid' : 'outline'}
                action={settings.fontScale === fontScale ? 'primary' : 'secondary'}
                style={settings.fontScale === fontScale ? styles.primaryButton : styles.ghostButton}
                onPress={() => void setFontScale(fontScale)}>
                <ButtonText color={settings.fontScale === fontScale ? futuristicTheme.colors.textDark : futuristicTheme.colors.textPrimary}>
                  {fontScale === 'normal' ? 'Normalny' : fontScale === 'large' ? 'Wiekszy' : 'Bardzo duzy'}
                </ButtonText>
              </Button>
            ))}
          </VStack>
        </VStack>

        <VStack space="xs">
          <Heading size="sm" color={futuristicTheme.colors.textPrimary}>Haptics</Heading>
          <Button
            size="sm"
            variant={settings.hapticsEnabled ? 'solid' : 'outline'}
            action={settings.hapticsEnabled ? 'primary' : 'secondary'}
            style={settings.hapticsEnabled ? styles.primaryButton : styles.ghostButton}
            onPress={() => void setHapticsEnabled(!settings.hapticsEnabled)}>
            <ButtonText color={settings.hapticsEnabled ? futuristicTheme.colors.textDark : futuristicTheme.colors.textPrimary}>
              {settings.hapticsEnabled ? 'Wlaczone' : 'Wylaczone'}
            </ButtonText>
          </Button>
          <Text color={futuristicTheme.colors.textMuted}>Wibracje przy akcjach i powiadomieniach.</Text>
        </VStack>

        <VStack space="sm">
          <Text color={futuristicTheme.colors.textMuted}>Potrzebujesz zobaczyc onboarding ponownie?</Text>
          <Button onPress={handleResetOnboarding} isDisabled={isResetting} style={styles.primaryButton}>
            <ButtonText color={futuristicTheme.colors.textDark}>{isResetting ? 'Przekierowanie...' : 'Uruchom onboarding ponownie'}</ButtonText>
          </Button>
        </VStack>
        {showDiagnostics ? (
          <VStack space="sm">
            <Text color={futuristicTheme.colors.textMuted}>Diagnostyka konfiguracji aplikacji.</Text>
            <Button onPress={() => router.push('/(drawer)/diagnostics')} style={styles.ghostButton} action="secondary" variant="outline">
              <ButtonText color={futuristicTheme.colors.textPrimary}>Otwórz diagnostykę</ButtonText>
            </Button>
          </VStack>
        ) : null}

        <VStack space="sm">
          <Text color={futuristicTheme.colors.textMuted}>
            Aktywny profil: {activeResidentAccount?.label ?? 'brak wybranego'}
          </Text>
          <Button
            onPress={() => router.push('/select-resident-account')}
            isDisabled={isLoggingOut}
            style={styles.ghostButton}
            action="secondary"
            variant="outline">
            <ButtonText color={futuristicTheme.colors.textPrimary}>Zmien profil mieszkanca</ButtonText>
          </Button>
          <Button
            onPress={handleLogout}
            isDisabled={isLoggingOut}
            style={styles.dangerButton}
            action="negative">
            <ButtonText color={futuristicTheme.colors.textPrimary}>
              {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
            </ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 12,
    ...futuristicShadows.glow,
  },
  ghostButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderWidth: 1,
  },
  dangerButton: {
    borderColor: futuristicTheme.colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
  },
});
