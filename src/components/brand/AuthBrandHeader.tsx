import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { appColors, appTheme } from '@/src/theme/app-theme';

import { PowiatLogoImage } from './PowiatLogoImage';

const LOGO_ASPECT = 1448 / 1086;

type AuthBrandHeaderProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  compact?: boolean;
  showLogo?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthBrandHeader({
  title = 'Powiat Decyduje',
  subtitle = 'Powiat Mławski',
  description,
  compact = false,
  showLogo = true,
  style,
}: AuthBrandHeaderProps) {
  const logoWidth = compact ? 118 : 140;
  const logoHeight = Math.round(logoWidth * LOGO_ASPECT);

  return (
    <Animated.View entering={FadeInDown.duration(420)} style={[styles.container, style]}>
      {showLogo ? <PowiatLogoImage width={logoWidth} height={logoHeight} /> : null}
      <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text>
      <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>{subtitle}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.md,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: 24,
  },
  subtitle: {
    color: appColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  subtitleCompact: {
    fontSize: 12,
    letterSpacing: 1.2,
  },
  description: {
    color: appColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
    marginTop: appTheme.spacing.xs,
  },
});
