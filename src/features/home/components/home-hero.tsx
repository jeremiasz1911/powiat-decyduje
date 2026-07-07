import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PowiatCountyLogoImage } from '@/src/components/brand/PowiatCountyLogoImage';
import { PowiatLogoImage } from '@/src/components/brand/PowiatLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const LOGO_ASPECT = 1448 / 1086;

type HomeHeroProps = {
  residentLabel?: string | null;
};

export function HomeHero({ residentLabel }: HomeHeroProps) {
  const { colors, colorScheme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const logoWidth = Math.min(screenWidth * 0.34, 128);
  const logoHeight = Math.round(logoWidth * LOGO_ASPECT);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [float]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [5, -5]) }],
  }));

  const greeting = residentLabel ? `Witaj, ${residentLabel}` : 'Witaj w Powiat Decyduje';

  return (
    <View style={styles.hero}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <PowiatLogoImage
          width={logoWidth}
          height={logoHeight}
          variant={colorScheme === 'dark' ? 'dark' : 'light'}
        />
      </Animated.View>

      <View style={styles.titleRow}>
        <Text
          style={[
            styles.appName,
            { color: colorScheme === 'dark' ? colors.textSecondary : colors.textPrimary },
          ]}>
          Powiat Decyduje
        </Text>
        <PowiatCountyLogoImage height={40} maxWidth={40} style={styles.countyLogo} />
      </View>
      <Text style={[styles.greeting, { color: colors.primary }]}>{greeting}</Text>
      <Text style={[styles.subline, { color: colors.textMuted }]}>
        Twój głos ma znaczenie — współdecyduj o projektach realizowanych w powiecie mławskim.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.sm,
  },
  logoWrap: {
    marginBottom: appTheme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appTheme.spacing.sm,
    maxWidth: '100%',
    paddingHorizontal: appTheme.spacing.sm,
  },
  countyLogo: {
    opacity: 0.92,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  subline: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 340,
    paddingHorizontal: appTheme.spacing.sm,
  },
});
