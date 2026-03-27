import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';
import { useSettings, type FontScalePreference, type ThemePreference } from '@/src/store/settings-context';

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
          <Heading size="sm">Motyw</Heading>
          <VStack space="xs">
            {themes.map((theme) => (
              <Button
                key={theme}
                size="sm"
                variant={settings.theme === theme ? 'solid' : 'outline'}
                action={settings.theme === theme ? 'primary' : 'secondary'}
                onPress={() => void setTheme(theme)}>
                <ButtonText>{theme === 'system' ? 'Systemowy' : theme === 'light' ? 'Jasny' : 'Ciemny'}</ButtonText>
              </Button>
            ))}
          </VStack>
        </VStack>

        <VStack space="xs">
          <Heading size="sm">Rozmiar tekstu</Heading>
          <VStack space="xs">
            {fontScales.map((fontScale) => (
              <Button
                key={fontScale}
                size="sm"
                variant={settings.fontScale === fontScale ? 'solid' : 'outline'}
                action={settings.fontScale === fontScale ? 'primary' : 'secondary'}
                onPress={() => void setFontScale(fontScale)}>
                <ButtonText>
                  {fontScale === 'normal' ? 'Normalny' : fontScale === 'large' ? 'Wiekszy' : 'Bardzo duzy'}
                </ButtonText>
              </Button>
            ))}
          </VStack>
        </VStack>

        <VStack space="xs">
          <Heading size="sm">Haptics</Heading>
          <Button
            size="sm"
            variant={settings.hapticsEnabled ? 'solid' : 'outline'}
            action={settings.hapticsEnabled ? 'primary' : 'secondary'}
            onPress={() => void setHapticsEnabled(!settings.hapticsEnabled)}>
            <ButtonText>{settings.hapticsEnabled ? 'Wlaczone' : 'Wylaczone'}</ButtonText>
          </Button>
          <Text color="$textLight600">Wibracje przy akcjach i powiadomieniach.</Text>
        </VStack>

        <VStack space="sm">
          <Text color="$textLight600">Potrzebujesz zobaczyc onboarding ponownie?</Text>
          <Button onPress={handleResetOnboarding} isDisabled={isResetting}>
            <ButtonText>{isResetting ? 'Przekierowanie...' : 'Uruchom onboarding ponownie'}</ButtonText>
          </Button>
        </VStack>
      </VStack>
    </ScreenContainer>
  );
}
