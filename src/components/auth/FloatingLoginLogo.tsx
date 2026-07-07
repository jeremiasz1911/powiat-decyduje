import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PowiatLogoImage } from '@/src/components/brand/PowiatLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const LOGO_ASPECT = 1448 / 1086;
const FLOAT_DURATION_MS = 5200;
const GLOW_DURATION_MS = 6000;
const FLOAT_DISTANCE = 5;

type FloatingLoginLogoProps = {
  description?: string;
  compact?: boolean;
  minimal?: boolean;
};

export function FloatingLoginLogo({ description, compact = false, minimal = false }: FloatingLoginLogoProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, colorScheme } = useAppTheme();
  const logoScale = minimal ? 0.28 : compact ? 0.46 : 0.58;
  const logoWidth = Math.min(screenWidth * logoScale, minimal ? 112 : compact ? 200 : 248);
  const logoHeight = Math.round(logoWidth * LOGO_ASPECT);
  const showGlow = !minimal;

  const float = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: FLOAT_DURATION_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    glow.value = withRepeat(
      withTiming(1, { duration: GLOW_DURATION_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [float, glow]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [FLOAT_DISTANCE, -FLOAT_DISTANCE]) },
      { scale: interpolate(float.value, [0, 0.5, 1], [1, 1.02, 1]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 0.5, 1], [0.1, 0.16, 0.1]),
    transform: [
      { scale: interpolate(glow.value, [0, 1], [1, 1.03]) },
      { translateY: interpolate(float.value, [0, 1], [FLOAT_DISTANCE * 0.6, -FLOAT_DISTANCE * 0.6]) },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.logoStage, { width: logoWidth, height: logoHeight }]}>
        {showGlow ? (
          <Animated.View
            style={[
              styles.glow,
              {
                width: logoWidth * 0.88,
                height: logoWidth * 0.88,
                borderRadius: logoWidth * 0.44,
                backgroundColor: colors.primarySoft,
                shadowColor: colors.primary,
              },
              glowStyle,
            ]}
          />
        ) : null}
        <Animated.View style={logoStyle}>
          <PowiatLogoImage
            width={logoWidth}
            height={logoHeight}
            variant={colorScheme === 'dark' ? 'dark' : 'light'}
          />
        </Animated.View>
      </View>
      {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.xs,
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  glow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
    fontWeight: '500',
  },
});
