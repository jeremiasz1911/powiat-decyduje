import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabNavIcons } from '@/src/navigation/nav-icons';
import { useAuthContext } from '@/src/store/auth-context';
import { useAppTheme } from '@/src/theme/theme-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { isGuest } = useAuthContext();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      initialRouteName={isGuest ? 'map' : 'index'}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          height: 58 + bottomInset,
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          href: isGuest ? null : undefined,
          tabBarIcon: ({ color, size }) => tabNavIcons.home(color, size),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => tabNavIcons.map(color, size),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projekty',
          tabBarIcon: ({ color, size }) => tabNavIcons.projects(color, size),
        }}
      />
      <Tabs.Screen
        name="my-votes"
        options={{
          title: 'Głosy',
          href: isGuest ? null : undefined,
          tabBarIcon: ({ color, size }) => tabNavIcons.myVotes(color, size),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          href: isGuest ? null : undefined,
          tabBarIcon: ({ color, size }) => tabNavIcons.settings(color, size),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'O aplikacji',
          href: isGuest ? undefined : null,
          tabBarIcon: ({ color, size }) => tabNavIcons.about(color, size),
        }}
      />
      <Tabs.Screen
        name="login-entry"
        options={{
          title: 'Zaloguj się',
          href: isGuest ? undefined : null,
          tabBarIcon: ({ color, size }) => tabNavIcons.login(color, size),
        }}
      />
      <Tabs.Screen
        name="project/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
