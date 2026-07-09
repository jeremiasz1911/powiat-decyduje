import { Text, VStack } from '@gluestack-ui/themed';
import { DrawerContentScrollView, DrawerItem, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { envFlags } from '@/src/config/env';
import { DecoratedScreenBackground } from '@/src/components/layout/decorated-screen-background';
import { drawerNavIcons } from '@/src/navigation/nav-icons';
import { useAuthContext } from '@/src/store/auth-context';
import { LoginRequiredProvider } from '@/src/store/login-required-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type DrawerNavKey = 'start' | 'map' | 'projects' | 'about' | 'login' | 'my-votes' | 'settings' | 'profile' | 'my-projects' | 'diagnostics';

function resolveActiveDrawerKey(segments: string[]): DrawerNavKey | null {
  const last = segments[segments.length - 1] ?? '';

  switch (last) {
    case 'index':
    case '(tabs)':
      return 'start';
    case 'map':
      return 'map';
    case 'projects':
      return 'projects';
    case 'about':
      return 'about';
    case 'login-entry':
      return 'login';
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
  const { activeResidentAccount, isGuest } = useAuthContext();
  const { colors } = useAppTheme();
  const showDiagnostics = __DEV__ || envFlags.diagnosticsEnabled;

  const goTo = (key: DrawerNavKey) => {
    switch (key) {
      case 'start':
        navigation.navigate('(tabs)', { screen: 'index' });
        break;
      case 'map':
        navigation.navigate('(tabs)', { screen: 'map' });
        break;
      case 'projects':
        navigation.navigate('(tabs)', { screen: 'projects' });
        break;
      case 'about':
        navigation.navigate('(tabs)', { screen: 'about' });
        break;
      case 'login':
        navigation.closeDrawer();
        router.push('/login-phone');
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
      activeTintColor={colors.primary}
      inactiveTintColor={colors.textMuted}
      activeBackgroundColor={colors.primarySoft}
      labelStyle={[styles.drawerLabel, { color: colors.textPrimary }]}
      style={styles.drawerItem}
    />
  );

  return (
    <View style={styles.drawerRoot}>
      <DecoratedScreenBackground />
      <SafeAreaView style={styles.drawerSafeArea} edges={['top', 'bottom', 'left']}>
        <DrawerContentScrollView
          {...props}
          style={styles.drawerScroll}
          contentContainerStyle={styles.drawerScrollContent}
          scrollEnabled>
        <VStack space="md" px="$3">
          <View style={styles.accountHeader}>
            <VStack space="xs">
              <Text color={colors.textPrimary} fontWeight="$bold" fontSize={17}>
                {isGuest ? 'Tryb gościa' : 'Powiat Decyduje'}
              </Text>
              {isGuest ? (
                <Text color={colors.textMuted} fontSize={14}>
                  Przeglądasz aplikację bez logowania.
                </Text>
              ) : (
                <>
                  <Text color={colors.textMuted} fontSize={14}>
                    {activeResidentAccount?.label ?? 'Brak wybranego profilu'}
                  </Text>
                </>
              )}
            </VStack>
          </View>

          {!isGuest ? renderNavItem('start', 'Start', drawerNavIcons.home) : null}
          {renderNavItem('map', 'Mapa', drawerNavIcons.map)}
          {renderNavItem('projects', 'Projekty', drawerNavIcons.projects)}
          {isGuest ? renderNavItem('about', 'O aplikacji', drawerNavIcons.about) : null}
          {isGuest ? renderNavItem('login', 'Zaloguj się', drawerNavIcons.login) : null}
          {!isGuest ? renderNavItem('my-votes', 'Głosy', drawerNavIcons.myVotes) : null}
          {!isGuest ? renderNavItem('my-projects', 'Moje projekty', drawerNavIcons.myProjects) : null}
          {!isGuest ? renderNavItem('profile', 'Profil', drawerNavIcons.profile) : null}
          {!isGuest ? renderNavItem('settings', 'Ustawienia', drawerNavIcons.settings) : null}
          {showDiagnostics ? renderNavItem('diagnostics', 'Diagnostyka', drawerNavIcons.diagnostics) : null}
        </VStack>
      </DrawerContentScrollView>
    </SafeAreaView>
    </View>
  );
}

export default function DrawerLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <LoginRequiredProvider>
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        swipeEnabled: true,
        sceneContainerStyle: {
          backgroundColor: colors.background,
        },
        headerStatusBarHeight: insets.top,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.textPrimary,
        },
        drawerStyle: {
          backgroundColor: 'transparent',
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
    </LoginRequiredProvider>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
  },
  drawerSafeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  drawerScroll: {
    backgroundColor: 'transparent',
  },
  drawerScrollContent: {
    flexGrow: 1,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.lg,
  },
  accountHeader: {
    paddingHorizontal: appTheme.spacing.xs,
    paddingBottom: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.xs,
  },
  drawerItem: {
    borderRadius: 10,
    marginHorizontal: 0,
  },
  drawerLabel: {
    fontWeight: '600',
    fontSize: 15,
  },
});
