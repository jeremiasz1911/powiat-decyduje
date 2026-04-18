import { useLocalSearchParams } from 'expo-router';
import { Box, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';

export default function VerifyResidentPhoneScreen() {
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    verificationId?: string;
    pesel?: string;
  }>();

  return (
    <ScreenContainer
      title="Weryfikacja SMS"
      description="To jest placeholder kroku weryfikacji kodu SMS.">
      <Box>
        <VStack space="sm">
          <Text>Numer telefonu: {params.phoneNumber ?? '-'}</Text>
          <Text>Verification ID: {params.verificationId ? 'otrzymany' : 'brak'}</Text>
          <Text>PESEL: {params.pesel ?? '-'}</Text>
        </VStack>
      </Box>
    </ScreenContainer>
  );
}
