import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabNavIcons } from '@/src/navigation/nav-icons';
import { appTheme } from '@/src/theme/app-theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarStyle: {
          height: 58 + bottomInset,
          backgroundColor: appTheme.colors.background,
          borderTopColor: appTheme.colors.border,
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
          href: null,
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
          tabBarIcon: ({ color, size }) => tabNavIcons.myVotes(color, size),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color, size }) => tabNavIcons.settings(color, size),
        }}
      />
    </Tabs>
  );
}
