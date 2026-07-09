import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/layout/app-screen';
import { PowiatCountyPartnerSection } from '@/src/components/brand/PowiatCountyPartnerSection';
import { SettingsDivider, SettingsGroup } from '@/src/components/settings/settings-ui';
import { HomeHero } from '@/src/features/home/components/home-hero';
import { HomeTileGrid, type HomeTileConfig } from '@/src/features/home/components/home-tile';
import { useAuthContext } from '@/src/store/auth-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';
import { useMemo } from 'react';

const HOME_TILES: HomeTileConfig[] = [
  {
    id: 'map',
    title: 'Mapa',
    description: 'Zobacz projekty na mapie powiatu.',
    icon: 'map-outline',
    route: '/(drawer)/(tabs)/map',
  },
  {
    id: 'projects',
    title: 'Projekty',
    description: 'Przeglądaj inicjatywy obywatelskie.',
    icon: 'briefcase-outline',
    route: '/(drawer)/(tabs)/projects',
  },
  {
    id: 'votes',
    title: 'Głosy',
    description: 'Oddawaj głosy na wybrane projekty.',
    icon: 'checkmark-done-outline',
    route: '/(drawer)/(tabs)/my-votes',
  },
  {
    id: 'settings',
    title: 'Ustawienia',
    description: 'Konto, wygląd i dostępność.',
    icon: 'settings-outline',
    route: '/(drawer)/(tabs)/settings',
  },
];

export default function HomeScreen() {
  const { activeResidentAccount, isGuest } = useAuthContext();
  const { colors } = useAppTheme();
  const firstName = activeResidentAccount?.label?.split(' ')[0] ?? null;
  const tiles = useMemo(
    () => (isGuest ? HOME_TILES.filter((tile) => tile.id === 'map' || tile.id === 'projects') : HOME_TILES),
    [isGuest]
  );

  return (
    <AppScreen cherryBackground scroll edges={[]} contentContainerStyle={styles.content}>
      <HomeHero residentLabel={isGuest ? null : firstName} />

      <SettingsGroup title="Szybki dostęp">
        <HomeTileGrid tiles={tiles} />
      </SettingsGroup>

      <SettingsDivider />

      <View style={styles.aboutSection}>
        <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>O projekcie</Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          <Text style={[styles.aboutStrong, { color: colors.textPrimary }]}>Powiat Decyduje</Text> to projekt stworzony z inicjatywy
          Młodzieżowej Rady Powiatu, którego celem jest zwiększenie zaangażowania mieszkańców w życie
          lokalnej społeczności. Aplikacja umożliwia wygodne przeglądanie projektów, oddawanie głosów
          oraz śledzenie inicjatyw realizowanych na terenie powiatu.
        </Text>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Projekt powstał z inicjatywy radnej{' '}
          <Text style={[styles.aboutStrong, { color: colors.textPrimary }]}>Aleksandry Rutkowskiej</Text> we współpracy z Młodzieżową Radą
          Powiatu, aby wykorzystać nowoczesne technologie do wspierania dialogu między mieszkańcami a
          samorządem.
        </Text>
        <PowiatCountyPartnerSection style={[styles.aboutPartner, { borderTopColor: colors.border }]} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.xl,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
    gap: appTheme.spacing.lg,
  },
  aboutSection: {
    gap: appTheme.spacing.md,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 23,
  },
  aboutStrong: {
    fontWeight: '700',
  },
  aboutPartner: {
    marginTop: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
