import { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

import { secureStore } from '@/src/lib/secure-store';
import { auth } from '@/src/lib/firebase';

export default function ProfileScreen() {
  const [tokenPreview, setTokenPreview] = useState<string>('brak');

  useEffect(() => {
    const loadToken = async () => {
      const token = await secureStore.get('session_token');
      setTokenPreview(token ? `${token.slice(0, 8)}...` : 'brak');
    };

    void loadToken();
  }, []);

  return (
    <Box flex={1} px="$4" py="$8" bg="$backgroundLight0">
      <VStack space="md">
        <Heading size="lg">Profil</Heading>
        <Text>Status auth: {auth.currentUser ? 'zalogowany' : 'niezalogowany'}</Text>
        <Text>Token (SecureStore): {tokenPreview}</Text>
      </VStack>
    </Box>
  );
}
