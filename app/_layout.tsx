import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';

import { AppProviders } from '@/src/components/app-providers';
import { AppStartup } from '@/src/components/app-startup';
import { ThemeStatusBar } from '@/src/components/theme-status-bar';

export default function RootLayout() {
  return (
    <AppProviders>
      <AppStartup>
        <Stack screenOptions={{ animation: 'fade' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="register-resident" options={{ title: 'Rejestracja' }} />
        <Stack.Screen
          name="login-phone"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent', flex: 1 },
            animation: 'fade',
          }}
        />
        <Stack.Screen name="login-password" options={{ title: 'Logowanie' }} />
        <Stack.Screen name="recover-access-phone" options={{ title: 'Nie pamiętam hasła' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset hasła' }} />
        <Stack.Screen name="verify-resident-phone" options={{ title: 'Kod SMS' }} />
        <Stack.Screen name="select-resident-account" options={{ title: 'Wybór profilu' }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false, contentStyle: { backgroundColor: 'transparent', flex: 1 } }} />
      </Stack>
      <ThemeStatusBar />
      </AppStartup>
    </AppProviders>
  );
}
