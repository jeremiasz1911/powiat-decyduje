import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/layout/app-screen';
import { PowiatCountyLogoImage } from '@/src/components/brand/PowiatCountyLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

export default function AboutScreen() {
  const { colors } = useAppTheme();
  return (
    <AppScreen cherryBackground scroll edges={[]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PowiatCountyLogoImage height={56} maxWidth={56} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Powiat Decyduje</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Aplikacja mieszkańców powiatu mławskiego
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>O aplikacji</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          To projekt stworzony z inicjatywy Młodzieżowej Rady Powiatu, którego celem jest zwiększenie
          zaangażowania mieszkańców w życie lokalnej społeczności. Aplikacja umożliwia wygodne przeglądanie
          projektów, oddawanie głosów oraz śledzenie inicjatyw realizowanych na terenie powiatu.
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Projekt powstał z inicjatywy radnej{' '}
          <Text style={[styles.strong, { color: colors.textPrimary }]}>Aleksandry Rutkowskiej</Text> we
          współpracy z Młodzieżową Radą Powiatu, aby wykorzystać nowoczesne technologie do wspierania dialogu
          między mieszkańcami a samorządem.
        </Text>
      </View>

      <View style={[styles.section, styles.sectionBorder, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tryb gościa</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Możesz przeglądać mapę i listę projektów bez konta. Aby głosować lub zgłaszać własne inicjatywy,
          zaloguj się jako mieszkaniec powiatu.
        </Text>
      </View>

      <Text style={[styles.footerCaption, { color: colors.textMuted }]}>
        Projekt realizowany przy wsparciu Powiatu Mławskiego
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.xl,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
    gap: appTheme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    gap: appTheme.spacing.md,
  },
  sectionBorder: {
    paddingTop: appTheme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
  },
  strong: {
    fontWeight: '700',
  },
  footerCaption: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: appTheme.spacing.sm,
  },
});
