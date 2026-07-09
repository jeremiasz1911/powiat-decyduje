import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { brandColors } from '@/src/theme/brand';

import { PowiatLogoSymbol, StaticPowiatLogoSymbol } from './PowiatLogoSymbol';

export type AnimatedPowiatLogoProps = {
  size?: number;
  showSubtitle?: boolean;
  animated?: boolean;
  onAnimationEnd?: () => void;
};

const FINAL_SYMBOL_OFFSET = -8;

export function AnimatedPowiatLogo({
  size = 112,
  showSubtitle = true,
  animated = true,
  onAnimationEnd,
}: AnimatedPowiatLogoProps) {
  const ringDraw = useSharedValue(animated ? 0 : 1);
  const checkOpacity = useSharedValue(animated ? 0 : 1);
  const ringRotation = useSharedValue(0);
  const symbolScale = useSharedValue(animated ? 0.92 : 1);
  const symbolTranslateY = useSharedValue(animated ? 0 : FINAL_SYMBOL_OFFSET);
  const glowOpacity = useSharedValue(animated ? 0.2 : 0.55);
  const titleOpacity = useSharedValue(animated ? 0 : 1);
  const titleTranslateY = useSharedValue(animated ? 14 : 0);
  const subtitleOpacity = useSharedValue(animated ? 0 : showSubtitle ? 1 : 0);
  const completionPulse = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      return;
    }

    ringDraw.value = withTiming(1, { duration: 780, easing: Easing.out(Easing.cubic) });
    ringRotation.value = withSequence(
      withTiming(6, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(-4, { duration: 360, easing: Easing.inOut(Easing.cubic) }),
      withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })
    );
    checkOpacity.value = withDelay(680, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    symbolScale.value = withDelay(
      920,
      withSequence(
        withSpring(1.06, { damping: 9, stiffness: 210 }),
        withSpring(1, { damping: 13, stiffness: 170 })
      )
    );
    symbolTranslateY.value = withDelay(1080, withSpring(FINAL_SYMBOL_OFFSET, { damping: 14, stiffness: 130 }));
    glowOpacity.value = withDelay(900, withTiming(0.55, { duration: 500, easing: Easing.out(Easing.cubic) }));
    titleOpacity.value = withDelay(1180, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(1180, withSpring(0, { damping: 15, stiffness: 140 }));

    if (showSubtitle) {
      subtitleOpacity.value = withDelay(
        1420,
        withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) })
      );
    }

    if (onAnimationEnd) {
      const completionDelay = showSubtitle ? 1920 : 1720;
      completionPulse.value = withDelay(
        completionDelay,
        withTiming(1, { duration: 0 }, (finished) => {
          if (finished) {
            runOnJS(onAnimationEnd)();
          }
        })
      );
    }
  }, [
    animated,
    checkOpacity,
    completionPulse,
    glowOpacity,
    onAnimationEnd,
    ringDraw,
    ringRotation,
    showSubtitle,
    subtitleOpacity,
    symbolScale,
    symbolTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 0.88 + glowOpacity.value * 0.12 }],
  }));

  const symbolStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + ringDraw.value * 0.6,
    transform: [{ scale: symbolScale.value }, { translateY: symbolTranslateY.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: titleTranslateY.value * 0.6 }],
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="image"
      accessibilityLabel="Logo aplikacji Powiat Decyduje">
      <View style={[styles.symbolArea, { width: size + 48, height: size + 24 }]}>
        <Animated.View
          style={[
            styles.glow,
            {
              width: size * 1.35,
              height: size * 1.35,
              borderRadius: size * 0.675,
            },
            glowStyle,
          ]}
        />
        <Animated.View style={[styles.symbolFrame, { width: size, height: size, borderRadius: size * 0.24 }, symbolStyle]}>
          {animated ? (
            <PowiatLogoSymbol
              size={size * 0.62}
              ringDraw={ringDraw}
              checkOpacity={checkOpacity}
              ringRotation={ringRotation}
            />
          ) : (
            <StaticPowiatLogoSymbol size={size * 0.62} />
          )}
        </Animated.View>
      </View>

      <Animated.Text style={[styles.title, titleStyle]} accessibilityRole="header">
        Powiat Decyduje
      </Animated.Text>

      {showSubtitle ? (
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>Aplikacja dla mieszkańców</Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  symbolArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(220, 20, 60, 0.16)',
  },
  symbolFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.22)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
  title: {
    color: brandColors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: brandColors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
