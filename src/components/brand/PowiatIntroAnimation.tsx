import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors } from '@/src/theme/brand';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHECK_PATH = 'M 38 52 L 52 66 L 78 38';
const CHECK_PATH_LENGTH = 58;

const CARD_WIDTH = 220;
const CARD_HEIGHT = 148;
const CARD_RADIUS = 20;

export type PowiatIntroAnimationProps = {
  onFinish?: () => void;
  durationMs?: number;
  skip?: boolean;
};

export function PowiatIntroAnimation({
  onFinish,
  durationMs = 4500,
  skip = false,
}: PowiatIntroAnimationProps) {
  const { width: screenWidth } = useWindowDimensions();

  const cardTranslateX = useSharedValue(skip ? 0 : screenWidth * 0.55);
  const cardScale = useSharedValue(skip ? 1 : 0.96);
  const cardPulse = useSharedValue(1);
  const blurGhostOpacity = useSharedValue(skip ? 0 : 0.35);

  const checkDraw = useSharedValue(skip ? 1 : 0);
  const checkScale = useSharedValue(skip ? 1 : 0.9);

  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  const titleOpacity = useSharedValue(skip ? 1 : 0);
  const titleTranslateY = useSharedValue(skip ? 0 : 24);
  const titleLetterSpacing = useSharedValue(skip ? 0.5 : 3);
  const subtitleOpacity = useSharedValue(skip ? 1 : 0);

  const flagOpacity = useSharedValue(skip ? 0.1 : 0);
  const flagTranslateX = useSharedValue(skip ? 0 : -20);
  const flashOpacity = useSharedValue(0);
  const finalFlashOpacity = useSharedValue(0);
  const completionPulse = useSharedValue(0);

  useEffect(() => {
    if (skip) {
      if (onFinish) {
        onFinish();
      }
      return;
    }

    cardTranslateX.value = withTiming(0, { duration: 980, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSequence(
      withTiming(1.02, { duration: 820, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    blurGhostOpacity.value = withSequence(
      withTiming(0.38, { duration: 80 }),
      withTiming(0, { duration: 720, easing: Easing.out(Easing.cubic) })
    );

    checkDraw.value = withDelay(1000, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    checkScale.value = withDelay(
      1300,
      withSequence(
        withSpring(1.1, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      )
    );

    pulse1.value = withDelay(2000, withTiming(1, { duration: 820, easing: Easing.out(Easing.quad) }));
    pulse2.value = withDelay(2180, withTiming(1, { duration: 820, easing: Easing.out(Easing.quad) }));
    cardPulse.value = withDelay(
      2000,
      withSequence(
        withSpring(1.035, { damping: 10, stiffness: 280 }),
        withSpring(1, { damping: 14, stiffness: 200 })
      )
    );
    flashOpacity.value = withDelay(
      2000,
      withSequence(
        withTiming(0.12, { duration: 140 }),
        withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) })
      )
    );

    titleOpacity.value = withDelay(3000, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(3000, withSpring(0, { damping: 14, stiffness: 140 }));
    titleLetterSpacing.value = withDelay(3000, withTiming(0.5, { duration: 520, easing: Easing.out(Easing.cubic) }));
    subtitleOpacity.value = withDelay(3380, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));

    flagOpacity.value = withDelay(4000, withTiming(0.1, { duration: 620, easing: Easing.out(Easing.cubic) }));
    flagTranslateX.value = withDelay(4000, withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) }));
    finalFlashOpacity.value = withDelay(
      4300,
      withSequence(
        withTiming(0.1, { duration: 90 }),
        withTiming(0, { duration: 110, easing: Easing.out(Easing.cubic) })
      )
    );

    if (onFinish) {
      completionPulse.value = withDelay(
        durationMs,
        withTiming(1, { duration: 0 }, (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        })
      );
    }
  }, [
    blurGhostOpacity,
    cardPulse,
    cardScale,
    cardTranslateX,
    checkDraw,
    checkScale,
    completionPulse,
    durationMs,
    finalFlashOpacity,
    flagOpacity,
    flagTranslateX,
    flashOpacity,
    onFinish,
    pulse1,
    pulse2,
    skip,
    subtitleOpacity,
    titleLetterSpacing,
    titleOpacity,
    titleTranslateY,
  ]);

  const ghost1Style = useAnimatedStyle(() => ({
    opacity: blurGhostOpacity.value * 0.55,
    transform: [
      { translateX: cardTranslateX.value + 28 },
      { scale: cardScale.value * 0.98 },
    ],
  }));

  const ghost2Style = useAnimatedStyle(() => ({
    opacity: blurGhostOpacity.value * 0.35,
    transform: [
      { translateX: cardTranslateX.value + 52 },
      { scale: cardScale.value * 0.96 },
    ],
  }));

  const ghost3Style = useAnimatedStyle(() => ({
    opacity: blurGhostOpacity.value * 0.2,
    transform: [
      { translateX: cardTranslateX.value + 74 },
      { scale: cardScale.value * 0.94 },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cardTranslateX.value },
      { scale: cardScale.value * cardPulse.value },
    ],
  }));

  const checkContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - checkDraw.value),
  }));

  const pulse1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse1.value, [0, 0.15, 1], [0, 0.55, 0]),
    transform: [{ scale: interpolate(pulse1.value, [0, 1], [0.4, 2.6]) }],
  }));

  const pulse2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse2.value, [0, 0.15, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(pulse2.value, [0, 1], [0.35, 2.2]) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    letterSpacing: titleLetterSpacing.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: titleTranslateY.value * 0.5 }],
  }));

  const flagStyle = useAnimatedStyle(() => ({
    opacity: flagOpacity.value,
    transform: [{ translateX: flagTranslateX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const finalFlashStyle = useAnimatedStyle(() => ({
    opacity: finalFlashOpacity.value,
  }));

  const renderGhostCard = (style: object) => (
    <Animated.View style={[styles.card, styles.ghostCard, style]}>
      <View style={styles.redAccent} />
    </Animated.View>
  );

  return (
    <View
      style={styles.root}
      accessibilityRole="image"
      accessibilityLabel="Animowane logo aplikacji Powiat Decyduje">
      <LinearGradient
        colors={[brandColors.white, '#FFF5F5', brandColors.white]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.flag, flagStyle]} pointerEvents="none">
        <View style={styles.flagWhite} />
        <View style={styles.flagRed} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centerStage}>
          {renderGhostCard(ghost3Style)}
          {renderGhostCard(ghost2Style)}
          {renderGhostCard(ghost1Style)}

          <Animated.View style={[styles.card, cardStyle]}>
            <View style={styles.redAccent} />

            <View style={styles.cardBody}>
              <Animated.View style={[styles.pulseRing, pulse1Style]} />
              <Animated.View style={[styles.pulseRing, pulse2Style]} />

              <Animated.View style={checkContainerStyle}>
                <Svg width={116} height={96} viewBox="0 0 116 96">
                  <AnimatedPath
                    d={CHECK_PATH}
                    stroke={brandColors.red}
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={CHECK_PATH_LENGTH}
                    animatedProps={checkProps}
                  />
                </Svg>
              </Animated.View>
            </View>
          </Animated.View>

          <View style={styles.textBlock}>
            <Animated.Text style={[styles.title, titleStyle]} accessibilityRole="header">
              Powiat Decyduje
            </Animated.Text>
            <Animated.Text style={[styles.subtitle, subtitleStyle]}>Aplikacja dla mieszkańców</Animated.Text>
          </View>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />
      <Animated.View style={[styles.flashOverlay, finalFlashStyle]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  safeArea: {
    flex: 1,
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  flag: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  flagRed: {
    flex: 1,
    backgroundColor: brandColors.red,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    backgroundColor: brandColors.white,
    borderWidth: 1,
    borderColor: brandColors.border,
    overflow: 'hidden',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
  ghostCard: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.08)',
    shadowOpacity: 0.06,
    elevation: 2,
  },
  redAccent: {
    height: 5,
    backgroundColor: brandColors.red,
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: brandColors.red,
  },
  textBlock: {
    marginTop: 28,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: brandColors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: brandColors.muted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brandColors.white,
  },
});
