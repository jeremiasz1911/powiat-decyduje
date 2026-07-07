import { StyleSheet, Text, View } from 'react-native';

import { PowiatCountyLogoImage } from '@/src/components/brand/PowiatCountyLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

export function LoginScreenFooter() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <View style={styles.brandRow}>
        <PowiatCountyLogoImage height={40} maxWidth={40} style={styles.crest} />
        <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Powiat Decyduje</Text>
      </View>
      <Text style={[styles.caption, { color: colors.textMuted }]}>
        Projekt realizowany przy wsparciu Powiatu Mławskiego
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appTheme.spacing.sm,
  },
  crest: {
    opacity: 0.94,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  caption: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 260,
  },
});
