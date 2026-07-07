import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type NavIconProps = {
  color: string;
  size: number;
  name: IoniconName;
};

export function NavIcon({ color, size, name }: NavIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

export const drawerNavIcons = {
  home: (color: string, size: number) => <NavIcon name="home-outline" color={color} size={size} />,
  map: (color: string, size: number) => <NavIcon name="map-outline" color={color} size={size} />,
  projects: (color: string, size: number) => <NavIcon name="briefcase-outline" color={color} size={size} />,
  myVotes: (color: string, size: number) => (
    <NavIcon name="checkmark-done-outline" color={color} size={size} />
  ),
  settings: (color: string, size: number) => <NavIcon name="settings-outline" color={color} size={size} />,
  profile: (color: string, size: number) => <NavIcon name="person-outline" color={color} size={size} />,
  myProjects: (color: string, size: number) => (
    <NavIcon name="folder-open-outline" color={color} size={size} />
  ),
  diagnostics: (color: string, size: number) => <NavIcon name="bug-outline" color={color} size={size} />,
  login: (color: string, size: number) => <NavIcon name="log-in-outline" color={color} size={size} />,
  about: (color: string, size: number) => (
    <NavIcon name="information-circle-outline" color={color} size={size} />
  ),
  switchProfile: (color: string, size: number) => <NavIcon name="people-outline" color={color} size={size} />,
  logout: (_color: string, size: number) => <NavIcon name="log-out-outline" color="#DC2626" size={size} />,
} as const;

export const tabNavIcons = {
  home: (color: string, size: number) => <NavIcon name="home-outline" color={color} size={size} />,
  map: (color: string, size: number) => <NavIcon name="map-outline" color={color} size={size} />,
  projects: (color: string, size: number) => <NavIcon name="briefcase-outline" color={color} size={size} />,
  myVotes: (color: string, size: number) => (
    <NavIcon name="checkmark-done-outline" color={color} size={size} />
  ),
  settings: (color: string, size: number) => <NavIcon name="settings-outline" color={color} size={size} />,
  about: (color: string, size: number) => (
    <NavIcon name="information-circle-outline" color={color} size={size} />
  ),
  login: (color: string, size: number) => <NavIcon name="log-in-outline" color={color} size={size} />,
} as const;
