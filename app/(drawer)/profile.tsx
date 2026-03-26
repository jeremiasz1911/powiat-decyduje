import { useEffect, useState } from 'react';
import { Text } from '@gluestack-ui/themed';

import { auth } from '@/src/lib/firebase';
import { secureStore } from '@/src/lib/secure-store';
import { ScreenContainer } from '@/src/components/screen-container';

export default function DrawerProfileScreen() {
  const [tokenPreview, setTokenPreview] = useState('none');

  useEffect(() => {
    const loadToken = async () => {
      const token = await secureStore.get('session_token');
      setTokenPreview(token ? `${token.slice(0, 8)}...` : 'none');
    };

    void loadToken();
  }, []);

  return (
    <ScreenContainer title="Profile" description="Your account summary and secure session state.">
      <Text>Status: {auth.currentUser ? 'authenticated' : 'guest'}</Text>
      <Text>Secure token: {tokenPreview}</Text>
    </ScreenContainer>
  );
}
