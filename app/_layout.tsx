import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/src/components/app-providers';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ animation: 'fade' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="register-resident" options={{ title: 'Rejestracja' }} />
        <Stack.Screen name="login-phone" options={{ title: 'Logowanie' }} />
        <Stack.Screen name="recover-access-phone" options={{ title: 'Odzyskiwanie dostepu' }} />
        <Stack.Screen name="verify-resident-phone" options={{ title: 'Kod SMS' }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </AppProviders>
  );
}
