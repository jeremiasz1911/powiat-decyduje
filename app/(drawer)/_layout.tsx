import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { Box, Divider, Text, VStack } from '@gluestack-ui/themed';

import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { useAuthContext } from '@/src/store/auth-context';
import { futuristicTheme } from '@/src/theme/futuristic';

export default function DrawerLayout() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { activeResidentAccount, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      await notify('Wylogowano', 'Wylogowano z konta mieszkanca.', 'success');
      router.replace('/login-phone');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie wylogowac.';
      await notify('Blad wylogowania', message, 'error');
    }
  };

  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#041a2d', paddingTop: 8 }}>
          <VStack space="md" px="$3">
            <Box
              borderWidth={1}
              borderColor={futuristicTheme.colors.border}
              bg={futuristicTheme.colors.panel}
              borderRadius={14}
              p="$3">
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary} fontWeight="$bold">
                  Konto
                </Text>
                <Text color={futuristicTheme.colors.textMuted}>
                  Profil: {activeResidentAccount?.label ?? 'Brak wybranego'}
                </Text>
                <Text color={futuristicTheme.colors.textMuted}>
                  PESEL: {activeResidentAccount?.pesel ?? '-'}
                </Text>
              </VStack>
            </Box>

            <DrawerItemList {...props} />
            <Divider bg={futuristicTheme.colors.border} />

            <DrawerItem
              label="Zmien profil mieszkanca"
              onPress={() => router.push('/select-resident-account')}
              icon={({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />}
              labelStyle={{ color: futuristicTheme.colors.textPrimary }}
              style={{ borderRadius: 10 }}
            />
            <DrawerItem
              label="Wyloguj"
              onPress={() => {
                void handleLogout();
              }}
              icon={({ size }) => (
                <Ionicons name="log-out-outline" size={size} color={futuristicTheme.colors.danger} />
              )}
              labelStyle={{ color: futuristicTheme.colors.danger, fontWeight: '700' }}
              style={{ borderRadius: 10 }}
            />
          </VStack>
        </DrawerContentScrollView>
      )}
      screenOptions={{
        headerShown: true,
        swipeEnabled: true,
        headerStyle: {
          backgroundColor: '#03182f',
        },
        headerTintColor: futuristicTheme.colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: '#041a2d',
        },
        drawerActiveTintColor: futuristicTheme.colors.accent,
        drawerInactiveTintColor: futuristicTheme.colors.textMuted,
        drawerActiveBackgroundColor: 'rgba(34, 211, 238, 0.14)',
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          headerTitle: 'Powiat Decyduje',
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profil',
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="my-projects"
        options={{
          title: 'Moje projekty',
          drawerIcon: ({ color, size }) => <Ionicons name="folder-open-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="map"
        options={{
          title: 'Mapa',
          drawerIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="my-votes"
        options={{
          title: 'Moje głosy',
          drawerIcon: ({ color, size }) => <Ionicons name="checkmark-done-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="submit-project"
        options={{
          title: 'Zgłoś projekt',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="project/[id]"
        options={{
          title: 'Szczegóły projektu',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="edit-project/[id]"
        options={{
          title: 'Edytuj projekt',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
