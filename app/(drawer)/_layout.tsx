import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { futuristicTheme } from '@/src/theme/futuristic';

export default function DrawerLayout() {
  return (
    <Drawer
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
