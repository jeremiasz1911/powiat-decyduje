import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PowiatLogoImage } from './PowiatLogoImage';
import { useAppTheme } from '@/src/theme/theme-context';

export const INTRO_DURATION_MS = 2400;

const brandColors = {
  white: '#FFFFFF',
  offWhite: '#FFF7F7',
  red: '#E30613',
  redSoft: 'rgba(227, 6, 19, 0.10)',
  redMedium: 'rgba(227, 6, 19, 0.18)',
  black: '#171D2B',
  gray: '#8A8F9B',
} as const;

const LOGO_ASPECT = 1448 / 1086;

type DecorItemConfig = {
  kind: 'line' | 'dot' | 'circle';
  top?: string;
  bottom?: string;
  left?: number | string;
  right?: number | string;
  width?: number;
  size?: number;
  rotate?: string;
};

const BG_DECOR: DecorItemConfig[] = [
  { kind: 'line', top: '12%', left: -30, width: 120, rotate: '-18deg' },
  { kind: 'line', top: '28%', right: -20, width: 90, rotate: '12deg' },
  { kind: 'dot', top: '18%', left: '14%', size: 5 },
  { kind: 'circle', top: '8%', right: '10%', size: 44 },
  { kind: 'line', bottom: '22%', left: '6%', width: 70, rotate: '24deg' },
  { kind: 'dot', bottom: '30%', right: '16%', size: 4 },
  { kind: 'circle', bottom: '14%', left: '12%', size: 32 },
  { kind: 'line', bottom: '38%', right: -25, width: 100, rotate: '-14deg' },
  { kind: 'dot', top: '42%', right: '8%', size: 3 },
  { kind: 'circle', top: '52%', left: -10, size: 56 },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PowiatStartAnimationProps = {
  onFinish?: () => void;
  onStartPress?: () => void;
  introFinished?: boolean;
  isLeaving?: boolean;
  durationMs?: number;
};

function DecorItem({
  item,
  progress,
  linesProgress,
}: {
  item: DecorItemConfig;
  progress: SharedValue<number>;
  linesProgress: SharedValue<number>;
}) {
  const decorStyle = useAnimatedStyle(() => {
    const baseOpacity = interpolate(progress.value, [0, 1], [0, 1]);
    const slideX = interpolate(linesProgress.value, [0, 1], [-20, 0]);

    if (item.kind === 'line') {
      return {
        opacity: baseOpacity * 0.55,
        transform: [{ translateX: slideX }, { rotate: item.rotate ?? '0deg' }],
      };
    }
    if (item.kind === 'dot') {
      return {
        opacity: baseOpacity * 0.45,
        transform: [{ translateX: slideX * 0.5 }],
      };
    }
    return {
      opacity: baseOpacity * 0.35,
      transform: [{ translateX: slideX * 0.3 }, { scale: interpolate(progress.value, [0, 1], [0.9, 1]) }],
    };
  });

  if (item.kind === 'line') {
    const positionStyle = {
      width: item.width,
      top: item.top,
      bottom: item.bottom,
      left: item.left,
      right: item.right,
    } as ViewStyle;

    return <Animated.View style={[styles.decorLine, positionStyle, decorStyle]} />;
  }

  if (item.kind === 'dot') {
    const size = item.size ?? 4;
    const positionStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      top: item.top,
      bottom: item.bottom,
      left: item.left,
      right: item.right,
    } as ViewStyle;

    return <Animated.View style={[styles.decorDot, positionStyle, decorStyle]} />;
  }

  const size = item.size ?? 32;
  const positionStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    top: item.top,
    bottom: item.bottom,
    left: item.left,
    right: item.right,
  } as ViewStyle;

  return <Animated.View style={[styles.decorCircle, positionStyle, decorStyle]} />;
}

export function PowiatStartAnimation({
  onFinish,
  onStartPress,
  introFinished = false,
  isLeaving = false,
  durationMs = INTRO_DURATION_MS,
}: PowiatStartAnimationProps) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useAppTheme();

  const logoWidth = Math.min(screenWidth * 0.78, 360);
  const logoHeight = Math.min(logoWidth * LOGO_ASPECT, 460);

  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);
  const decorProgress = useSharedValue(0);
  const linesProgress = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(36);
  const logoScale = useSharedValue(0.82);
  const logoRotate = useSharedValue(-2);
  const glowOpacity = useSharedValue(0);
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const shineProgress = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(24);
  const buttonScale = useSharedValue(0.96);
  const buttonPressScale = useSharedValue(1);

  const finalizeIntro = useCallback(() => {
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    if (__DEV__) {
      console.log('PowiatStartAnimation mounted');
    }
  }, []);

  useEffect(() => {
    const scale = durationMs / INTRO_DURATION_MS;
    const t = (ms: number) => Math.round(ms * scale);

    bgOpacity.value = withTiming(1, { duration: t(400), easing: Easing.out(Easing.cubic) });
    decorProgress.value = withTiming(1, { duration: t(500), easing: Easing.out(Easing.cubic) });
    linesProgress.value = withTiming(1, { duration: t(450), easing: Easing.out(Easing.cubic) });

    logoOpacity.value = withDelay(t(200), withTiming(1, { duration: t(500), easing: Easing.out(Easing.cubic) }));
    logoTranslateY.value = withDelay(t(200), withSpring(0, { damping: 13, stiffness: 160 }));
    logoRotate.value = withDelay(t(200), withSpring(0, { damping: 14, stiffness: 140 }));
    logoScale.value = withDelay(
      t(200),
      withSequence(
        withTiming(1.04, { duration: t(380), easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 12, stiffness: 180 })
      )
    );

    glowOpacity.value = withDelay(t(700), withTiming(1, { duration: t(400), easing: Easing.out(Easing.cubic) }));

    ripple1.value = withDelay(t(900), withTiming(1, { duration: t(550), easing: Easing.out(Easing.quad) }));
    ripple2.value = withDelay(t(1050), withTiming(1, { duration: t(550), easing: Easing.out(Easing.quad) }));

    shineProgress.value = withDelay(t(1300), withTiming(1, { duration: t(650), easing: Easing.inOut(Easing.cubic) }));

    buttonOpacity.value = withDelay(t(1700), withTiming(1, { duration: t(500), easing: Easing.out(Easing.cubic) }));
    buttonTranslateY.value = withDelay(t(1700), withSpring(0, { damping: 14, stiffness: 150 }));
    buttonScale.value = withDelay(
      t(1700),
      withSequence(
        withTiming(1, { duration: t(420), easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 12, stiffness: 160 })
      )
    );

    const completionTimer = setTimeout(() => {
      if (__DEV__) {
        console.log('Intro finished, showing button');
      }
      finalizeIntro();
    }, t(2400));

    return () => clearTimeout(completionTimer);
  }, [
    bgOpacity,
    buttonOpacity,
    buttonScale,
    buttonTranslateY,
    decorProgress,
    durationMs,
    finalizeIntro,
    glowOpacity,
    linesProgress,
    logoOpacity,
    logoRotate,
    logoScale,
    logoTranslateY,
    ripple1,
    ripple2,
    shineProgress,
  ]);

  useEffect(() => {
    if (!isLeaving) return;

    screenOpacity.value = withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) });
    screenScale.value = withTiming(1.04, { duration: 380, easing: Easing.in(Easing.cubic) });
    logoScale.value = withTiming(0.88, { duration: 380, easing: Easing.in(Easing.cubic) });
    logoTranslateY.value = withTiming(-28, { duration: 380, easing: Easing.in(Easing.cubic) });
    buttonOpacity.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
    buttonTranslateY.value = withTiming(12, { duration: 220, easing: Easing.in(Easing.cubic) });
  }, [buttonOpacity, buttonTranslateY, isLeaving, logoScale, logoTranslateY, screenOpacity, screenScale]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowOpacity.value, [0, 1], [0, 0.55]),
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.85, 1]) }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const ripple1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple1.value, [0, 0.12, 1], [0, 0.18, 0]),
    transform: [{ scale: interpolate(ripple1.value, [0, 1], [0.8, 1.5]) }],
  }));

  const ripple2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ripple2.value, [0, 0.12, 1], [0, 0.14, 0]),
    transform: [{ scale: interpolate(ripple2.value, [0, 1], [0.8, 1.65]) }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shineProgress.value, [0, 0.25, 0.55, 1], [0, 0.18, 0.12, 0]),
    transform: [
      { translateX: interpolate(shineProgress.value, [0, 1], [-screenWidth * 0.6, screenWidth * 0.6]) },
      { rotate: '-22deg' },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: buttonTranslateY.value },
      { scale: buttonScale.value * buttonPressScale.value },
    ],
  }));

  const handleButtonPressIn = () => {
    if (!introFinished || isLeaving) return;
    buttonPressScale.value = withTiming(0.96, { duration: 90 });
  };

  const handleButtonPressOut = () => {
    buttonPressScale.value = withSequence(
      withTiming(0.96, { duration: 0 }),
      withSpring(1, { damping: 10, stiffness: 220 })
    );
  };

  const handleButtonPress = () => {
    if (!introFinished || isLeaving) return;
    buttonPressScale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onStartPress?.();
  };

  return (
    <Animated.View
      style={[styles.root, { backgroundColor: colors.background }, screenStyle]}
      accessibilityRole="image"
      accessibilityLabel="Animacja startowa aplikacji Powiat Decyduje">
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ([colors.background, colors.backgroundSoft, colors.backgroundCherry, colors.background] as const)
              : ([brandColors.white, brandColors.offWhite, brandColors.white] as const)
          }
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.bgDecor} pointerEvents="none">
        {BG_DECOR.map((item, index) => (
          <DecorItem key={`decor-${index}`} item={item} progress={decorProgress} linesProgress={linesProgress} />
        ))}
        <Animated.View
          style={[
            styles.shine,
            colorScheme === 'dark' ? styles.shineDark : null,
            shineStyle,
          ]}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={[styles.logoStage, { width: logoWidth, height: logoHeight }]}>
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  width: logoWidth * 0.9,
                  height: logoWidth * 0.9,
                  borderRadius: logoWidth * 0.45,
                  backgroundColor: colors.primarySoft,
                },
                glowStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.ripple,
                { width: logoWidth * 0.5, height: logoWidth * 0.5, borderRadius: logoWidth * 0.25 },
                ripple1Style,
              ]}
            />
            <Animated.View
              style={[
                styles.ripple,
                { width: logoWidth * 0.5, height: logoWidth * 0.5, borderRadius: logoWidth * 0.25 },
                ripple2Style,
              ]}
            />
            <Animated.View style={logoStyle}>
              <PowiatLogoImage
                width={logoWidth}
                height={logoHeight}
                variant={colorScheme === 'dark' ? 'dark' : 'light'}
              />
            </Animated.View>
          </View>
        </View>

        <AnimatedPressable
          style={[styles.startButton, { bottom: Math.max(insets.bottom, 24) + 28 }, buttonStyle]}
          onPress={handleButtonPress}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          disabled={!introFinished || isLeaving}
          accessibilityRole="button"
          accessibilityLabel="Zaczynamy"
          accessibilityState={{ disabled: !introFinished || isLeaving }}>
          <Animated.Text style={styles.startText}>Zaczynamy</Animated.Text>
        </AnimatedPressable>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  decorLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: brandColors.redMedium,
  },
  decorDot: {
    position: 'absolute',
    backgroundColor: brandColors.red,
    opacity: 0.35,
  },
  decorCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: brandColors.redSoft,
    backgroundColor: 'transparent',
  },
  shine: {
    position: 'absolute',
    top: '34%',
    left: '50%',
    width: 140,
    height: 280,
    marginLeft: -70,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(227, 6, 19, 0.12)',
  },
  shineDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 77, 87, 0.18)',
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: brandColors.red,
  },
  startButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: brandColors.red,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 34,
    shadowColor: brandColors.red,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  startText: {
    color: brandColors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
