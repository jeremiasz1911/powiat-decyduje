import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LoginSlashLines } from '@/src/components/auth/LoginAnimatedBackground';
import { PowiatLogoImage } from '@/src/components/brand/PowiatLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const APP_LOGO_ASPECT = 1448 / 1086;
const FLOAT_DURATION_MS = 5200;
const GLOW_DURATION_MS = 6000;
const FLOAT_DISTANCE = 5;

export function LoginBrandedHeader() {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, colorScheme } = useAppTheme();
  const stageWidth = Math.min(screenWidth * 0.72, 280);
  const appLogoWidth = Math.min(screenWidth * 0.34, 132);
  const appLogoHeight = Math.round(appLogoWidth * APP_LOGO_ASPECT);

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

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [FLOAT_DISTANCE, -FLOAT_DISTANCE]) },
      { scale: interpolate(float.value, [0, 0.5, 1], [1, 1.015, 1]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 0.5, 1], [0.08, 0.14, 0.08]),
    transform: [
      { scale: interpolate(glow.value, [0, 1], [1, 1.04]) },
      { translateY: interpolate(float.value, [0, 1], [FLOAT_DISTANCE * 0.5, -FLOAT_DISTANCE * 0.5]) },
    ],
  }));

  return (
    <View style={[styles.stage, { width: stageWidth }]}>
      <View style={styles.slashLayer} pointerEvents="none">
        <LoginSlashLines scope="logo" logoWidth={stageWidth} intensity="subtle" />
      </View>

      <Animated.View
        style={[
          styles.glow,
          {
            width: stageWidth * 0.6,
            height: stageWidth * 0.6,
            borderRadius: stageWidth * 0.3,
            backgroundColor: colors.primarySoft,
            shadowColor: colors.primary,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[styles.foreground, foregroundStyle]}>
        <PowiatLogoImage
          width={appLogoWidth}
          height={appLogoHeight}
          variant={colorScheme === 'dark' ? 'dark' : 'light'}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    minHeight: 148,
    paddingVertical: appTheme.spacing.sm,
  },
  slashLayer: {
    ...StyleSheet.absoluteFillObject,
    top: -28,
    bottom: -16,
    left: -24,
    right: -24,
    zIndex: 0,
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    zIndex: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  foreground: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
});
