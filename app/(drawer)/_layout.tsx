import { Divider, Text, VStack } from '@gluestack-ui/themed';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { envFlags } from '@/src/config/env';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { drawerNavIcons } from '@/src/navigation/nav-icons';
import { useAuthContext } from '@/src/store/auth-context';
import { appColors, appTheme } from '@/src/theme/app-theme';

type DrawerNavKey = 'start' | 'map' | 'my-votes' | 'settings' | 'profile' | 'my-projects' | 'diagnostics';

function resolveActiveDrawerKey(segments: string[]): DrawerNavKey | null {
  const last = segments[segments.length - 1] ?? '';

  switch (last) {
    case 'index':
    case '(tabs)':
      return 'start';
    case 'map':
      return 'map';
    case 'my-votes':
      return 'my-votes';
    case 'settings':
      return 'settings';
    case 'profile':
      return 'profile';
    case 'my-projects':
      return 'my-projects';
    case 'diagnostics':
      return 'diagnostics';
    default:
      return null;
  }
}

function AppDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const segments = useSegments();
  const activeKey = resolveActiveDrawerKey(segments);
  const { navigation } = props;
  const { notify } = useAppFeedback();
  const { activeResidentAccount, logout } = useAuthContext();
  const showDiagnostics = __DEV__ || envFlags.diagnosticsEnabled;

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

  const goTo = (key: DrawerNavKey) => {
    switch (key) {
      case 'start':
        navigation.navigate('(tabs)', { screen: 'index' });
        break;
      case 'map':
        navigation.navigate('(tabs)', { screen: 'map' });
        break;
      case 'my-votes':
        navigation.navigate('(tabs)', { screen: 'my-votes' });
        break;
      case 'settings':
        navigation.navigate('(tabs)', { screen: 'settings' });
        break;
      case 'profile':
        navigation.navigate('profile');
        break;
      case 'my-projects':
        navigation.navigate('my-projects');
        break;
      case 'diagnostics':
        navigation.navigate('diagnostics');
        break;
    }
    navigation.closeDrawer();
  };

  const renderNavItem = (key: DrawerNavKey, label: string, icon: typeof drawerNavIcons.home) => (
    <DrawerItem
      key={key}
      label={label}
      focused={activeKey === key}
      onPress={() => goTo(key)}
      icon={({ color, size }) => icon(color, size)}
      activeTintColor={appTheme.colors.primary}
      inactiveTintColor={appTheme.colors.textMuted}
      activeBackgroundColor="rgba(227, 6, 19, 0.1)"
      labelStyle={styles.drawerLabel}
      style={styles.drawerItem}
    />
  );

  return (
    <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom', 'left']}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScrollContent}
        scrollEnabled>
        <VStack space="md" px="$3">
          <View style={styles.accountCard}>
            <VStack space="xs">
              <Text color={appTheme.colors.textPrimary} fontWeight="$bold">
                Konto
              </Text>
              <Text color={appTheme.colors.textMuted}>
                Profil: {activeResidentAccount?.label ?? 'Brak wybranego'}
              </Text>
              <Text color={appTheme.colors.textMuted}>
                PESEL: {activeResidentAccount?.pesel ?? '-'}
              </Text>
            </VStack>
          </View>

          {renderNavItem('start', 'Start', drawerNavIcons.home)}
          {renderNavItem('map', 'Mapa', drawerNavIcons.map)}
          {renderNavItem('my-votes', 'Głosy', drawerNavIcons.myVotes)}
          {renderNavItem('settings', 'Ustawienia', drawerNavIcons.settings)}
          {renderNavItem('profile', 'Profil', drawerNavIcons.profile)}
          {renderNavItem('my-projects', 'Moje projekty', drawerNavIcons.myProjects)}
          {showDiagnostics ? renderNavItem('diagnostics', 'Diagnostyka', drawerNavIcons.diagnostics) : null}

          <Divider bg={appTheme.colors.border} />

          <DrawerItem
            label="Zmien profil mieszkanca"
            onPress={() => {
              navigation.closeDrawer();
              router.push('/select-resident-account');
            }}
            icon={({ color, size }) => drawerNavIcons.switchProfile(color, size)}
            inactiveTintColor={appTheme.colors.textMuted}
            labelStyle={styles.drawerLabel}
            style={styles.drawerItem}
          />
          <DrawerItem
            label="Wyloguj"
            onPress={() => {
              navigation.closeDrawer();
              void handleLogout();
            }}
            icon={({ size }) => drawerNavIcons.logout(appTheme.colors.danger, size)}
            inactiveTintColor={appTheme.colors.textMuted}
            labelStyle={styles.drawerLabelDanger}
            style={styles.drawerItem}
          />
        </VStack>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default function DrawerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        swipeEnabled: true,
        headerStatusBarHeight: insets.top,
        headerStyle: {
          backgroundColor: appTheme.colors.background,
        },
        headerTintColor: appTheme.colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: appTheme.colors.background,
          width: 292,
        },
        drawerItemStyle: { display: 'none' },
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Start',
          headerTitle: 'Powiat Decyduje',
        }}
      />
      <Drawer.Screen
        name="map"
        options={{
          title: 'Mapa',
          headerTitle: 'Mapa',
        }}
      />
      <Drawer.Screen
        name="my-votes"
        options={{
          title: 'Głosy',
          headerTitle: 'Głosy',
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          headerTitle: 'Ustawienia',
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerTitle: 'Profil',
        }}
      />
      <Drawer.Screen
        name="my-projects"
        options={{
          title: 'Moje projekty',
          headerTitle: 'Moje projekty',
        }}
      />
      {__DEV__ || envFlags.diagnosticsEnabled ? (
        <Drawer.Screen
          name="diagnostics"
          options={{
            title: 'Diagnostyka',
            headerTitle: 'Diagnostyka',
          }}
        />
      ) : null}
      <Drawer.Screen
        name="submit-project"
        options={{
          title: 'Zglos projekt',
        }}
      />
      <Drawer.Screen
        name="project/[id]"
        options={{
          title: 'Szczegoly projektu',
        }}
      />
      <Drawer.Screen
        name="edit-project/[id]"
        options={{
          title: 'Edytuj projekt',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerSafeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  drawerScrollContent: {
    flexGrow: 1,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.lg,
  },
  accountCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    borderRadius: 14,
    padding: appTheme.spacing.md,
  },
  drawerItem: {
    borderRadius: 10,
    marginHorizontal: 0,
  },
  drawerLabel: {
    color: appTheme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  drawerLabelDanger: {
    color: appColors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
});
