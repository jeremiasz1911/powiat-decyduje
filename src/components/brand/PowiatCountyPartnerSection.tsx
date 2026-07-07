import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PowiatCountyLogoImage } from '@/src/components/brand/PowiatCountyLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type PowiatCountyPartnerSectionProps = {
  compact?: boolean;
  showCaption?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PowiatCountyPartnerSection({
  compact = false,
  showCaption = true,
  style,
}: PowiatCountyPartnerSectionProps) {
  const { colors } = useAppTheme();
  const logoHeight = compact ? 40 : 48;

  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null, style]}>
      {showCaption ? (
        <Text style={[styles.caption, compact ? styles.captionCompact : null, { color: colors.textMuted }]}>
          Projekt realizowany przy wsparciu Powiatu Mławskiego
        </Text>
      ) : null}
      <PowiatCountyLogoImage height={logoHeight} maxWidth={compact ? 96 : 112} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
  },
  wrapCompact: {
    gap: appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.sm,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 280,
  },
  captionCompact: {
    fontSize: 11,
    lineHeight: 16,
    maxWidth: 240,
  },
});
