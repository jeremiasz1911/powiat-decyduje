import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/layout/app-screen';
import { PowiatCountyPartnerSection } from '@/src/components/brand/PowiatCountyPartnerSection';
import { SettingsCard, SettingsGroup } from '@/src/components/settings/settings-ui';
import { HomeHero } from '@/src/features/home/components/home-hero';
import { HomeTileGrid, type HomeTileConfig } from '@/src/features/home/components/home-tile';
import { useAuthContext } from '@/src/store/auth-context';
import { appColors, appTheme } from '@/src/theme/app-theme';

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
  const { activeResidentAccount } = useAuthContext();
  const firstName = activeResidentAccount?.label?.split(' ')[0] ?? null;

  return (
    <AppScreen cherryBackground scroll contentContainerStyle={styles.content}>
      <View style={styles.sections}>
        <SettingsCard style={styles.heroCard}>
          <HomeHero residentLabel={firstName} />
        </SettingsCard>

        <SettingsGroup title="Szybki dostep">
          <View style={styles.tilesSection}>
            <HomeTileGrid tiles={HOME_TILES} />
          </View>
        </SettingsGroup>

        <SettingsGroup title="O projekcie">
          <SettingsCard style={styles.aboutCard}>
            <View style={styles.aboutBody}>
              <Text style={styles.aboutText}>
                <Text style={styles.aboutStrong}>Powiat Decyduje</Text> to projekt stworzony z inicjatywy
                Młodzieżowej Rady Powiatu, którego celem jest zwiększenie zaangażowania mieszkańców w życie
                lokalnej społeczności. Aplikacja umożliwia wygodne przeglądanie projektów, oddawanie głosów
                oraz śledzenie inicjatyw realizowanych na terenie powiatu.
              </Text>
              <Text style={styles.aboutText}>
                Projekt powstał z inicjatywy radnej{' '}
                <Text style={styles.aboutStrong}>Aleksandry Rutkowskiej</Text> we współpracy z Młodzieżową Radą
                Powiatu, aby wykorzystać nowoczesne technologie do wspierania dialogu między mieszkańcami a
                samorządem.
              </Text>
              <PowiatCountyPartnerSection style={styles.aboutPartner} />
            </View>
          </SettingsCard>
        </SettingsGroup>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
  },
  sections: {
    gap: appTheme.spacing.lg,
  },
  heroCard: {
    paddingVertical: appTheme.spacing.lg,
    paddingHorizontal: appTheme.spacing.md,
  },
  aboutCard: {
    padding: appTheme.spacing.lg,
  },
  aboutBody: {
    gap: appTheme.spacing.md,
  },
  aboutText: {
    color: appColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  aboutStrong: {
    color: appColors.textPrimary,
    fontWeight: '700',
  },
  aboutPartner: {
    marginTop: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },
  tilesSection: {
    width: '100%',
    marginTop: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.xs,
  },
});
