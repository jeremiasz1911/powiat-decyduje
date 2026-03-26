import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';

export default function TabSettingsScreen() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetOnboarding = async () => {
    setIsResetting(true);
    await secureStore.remove(STORAGE_KEYS.onboardingCompleted);
    router.replace('/onboarding');
  };

  return (
    <ScreenContainer
      title="Settings"
      description="Manage app preferences, notifications, and account options.">
      <VStack space="sm">
        <Text color="$textLight600">Need to see onboarding again? You can restart it below.</Text>
        <Button onPress={handleResetOnboarding} isDisabled={isResetting}>
          <ButtonText>{isResetting ? 'Przekierowanie...' : 'Uruchom onboarding ponownie'}</ButtonText>
        </Button>
      </VStack>
    </ScreenContainer>
  );
}
