import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';
import { useSettings, type FontScalePreference, type ThemePreference } from '@/src/store/settings-context';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

export default function DrawerSettingsScreen() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const { settings, setFontScale, setHapticsEnabled, setTheme } = useSettings();

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    await secureStore.remove(STORAGE_KEYS.onboardingCompleted);
    router.replace('/onboarding');
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
});
