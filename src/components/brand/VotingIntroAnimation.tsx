import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHECK_PATH = 'M 44 66 L 59 81 L 86 52';
const CHECK_PATH_LENGTH = 62;

const brandColors = {
  white: '#FFFFFF',
  offWhite: '#FFF7F7',
  red: '#DC143C',
  redStrong: '#C1121F',
  redDark: '#991B1B',
  text: '#111827',
  muted: '#6B7280',
  border: 'rgba(220, 20, 60, 0.20)',
  shadow: 'rgba(220, 20, 60, 0.18)',
  hand: '#F4D6C3',
  sleeve: '#DC143C',
} as const;

const HAND_PATH =
  'M 72 212 C 76 168, 102 136, 142 128 C 156 125, 170 127, 178 135 C 184 141, 186 149, 184 158 L 178 180 C 176 187, 170 192, 162 192 L 130 192 C 122 192, 116 195, 110 201 L 96 216 C 89 224, 77 224, 70 217 C 64 211, 70 206, 72 212 Z';

export type VotingIntroAnimationProps = {
  onFinish?: () => void;
  durationMs?: number;
};

export function VotingIntroAnimation({
  onFinish,
  durationMs = 4000,
}: VotingIntroAnimationProps) {
  useEffect(() => {
    if (__DEV__) {
      console.log('VotingIntroAnimation mounted');
    }
  }, []);

  const backgroundGlow = useSharedValue(0);
  const flagOpacity = useSharedValue(0);
  const handTranslateY = useSharedValue(260);
  const handBob = useSharedValue(0);
  const handRotate = useSharedValue(-8);
  const cardScale = useSharedValue(0.92);
  const cardShake = useSharedValue(0);
  const cardShine = useSharedValue(0);
  const symbolScale = useSharedValue(1);
  const checkDraw = useSharedValue(0);
  const checkScale = useSharedValue(0.8);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const particleBurst = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(28);
  const titleScale = useSharedValue(0.96);
  const titleLetterSpacing = useSharedValue(2.4);
  const subtitleOpacity = useSharedValue(0);
  const completionPulse = useSharedValue(0);

  const finalizeIntro = useCallback(() => {
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    const timelineScale = durationMs / 4000;
    const t = (ms: number) => Math.round(ms * timelineScale);

    backgroundGlow.value = withTiming(1, { duration: t(600), easing: Easing.out(Easing.cubic) });
    flagOpacity.value = withDelay(t(120), withTiming(0.12, { duration: t(420) }));

    handTranslateY.value = withDelay(
      t(600),
      withTiming(0, { duration: t(820), easing: Easing.out(Easing.cubic) })
    );
    handRotate.value = withDelay(
      t(620),
      withSequence(withTiming(1, { duration: t(320) }), withSpring(0, { damping: 12, stiffness: 160 }))
    );
    handBob.value = withDelay(
      t(1500),
      withRepeat(
        withSequence(
          withTiming(-6, { duration: t(580), easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: t(580), easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );

    cardScale.value = withDelay(
      t(720),
      withSequence(
        withSpring(1.04, { damping: 9, stiffness: 210 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      )
    );

    checkDraw.value = withDelay(
      t(1400),
      withTiming(1, { duration: t(650), easing: Easing.out(Easing.cubic) })
    );
    checkScale.value = withDelay(
      t(1880),
      withSequence(
        withSpring(1.16, { damping: 8, stiffness: 230 }),
        withSpring(1, { damping: 12, stiffness: 190 })
      )
    );

    pulse1.value = withDelay(t(2100), withTiming(1, { duration: t(620), easing: Easing.out(Easing.quad) }));
    pulse2.value = withDelay(t(2240), withTiming(1, { duration: t(620), easing: Easing.out(Easing.quad) }));
    pulse3.value = withDelay(t(2360), withTiming(1, { duration: t(620), easing: Easing.out(Easing.quad) }));
    particleBurst.value = withDelay(
      t(2260),
      withTiming(1, { duration: t(680), easing: Easing.out(Easing.cubic) })
    );

    cardShake.value = withDelay(
      t(2140),
      withSequence(
        withTiming(-2.4, { duration: t(60) }),
        withTiming(2.4, { duration: t(60) }),
        withTiming(0, { duration: t(80) })
      )
    );
    flashOpacity.value = withDelay(
      t(2220),
      withSequence(
        withTiming(0.14, { duration: t(90) }),
        withTiming(0, { duration: t(180), easing: Easing.out(Easing.cubic) })
      )
    );
    cardShine.value = withDelay(
      t(2520),
      withSequence(
        withTiming(1, { duration: t(340), easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: t(320), easing: Easing.out(Easing.cubic) })
      )
    );

    titleOpacity.value = withDelay(
      t(2800),
      withTiming(1, { duration: t(520), easing: Easing.out(Easing.cubic) })
    );
    titleTranslateY.value = withDelay(t(2800), withSpring(0, { damping: 14, stiffness: 150 }));
    titleScale.value = withDelay(t(2800), withTiming(1, { duration: t(460), easing: Easing.out(Easing.cubic) }));
    titleLetterSpacing.value = withDelay(
      t(2800),
      withTiming(0.5, { duration: t(560), easing: Easing.out(Easing.cubic) })
    );
    subtitleOpacity.value = withDelay(
      t(3050),
      withTiming(1, { duration: t(420), easing: Easing.out(Easing.cubic) })
    );
    symbolScale.value = withDelay(
      t(3460),
      withSequence(
        withTiming(1.025, { duration: t(170), easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: t(170), easing: Easing.inOut(Easing.cubic) })
      )
    );

    completionPulse.value = withDelay(
      t(4000),
      withTiming(1, { duration: 0 }, (finished) => {
        if (finished) {
          runOnJS(finalizeIntro)();
        }
      })
    );
  }, [
    backgroundGlow,
    cardShine,
    cardScale,
    cardShake,
    checkDraw,
    checkScale,
    completionPulse,
    durationMs,
    finalizeIntro,
    flashOpacity,
    flagOpacity,
    handBob,
    handRotate,
    handTranslateY,
    particleBurst,
    pulse1,
    pulse2,
    pulse3,
    subtitleOpacity,
    symbolScale,
    titleLetterSpacing,
    titleOpacity,
    titleScale,
    titleTranslateY,
  ]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backgroundGlow.value, [0, 1], [0, 0.95]),
    transform: [{ scale: interpolate(backgroundGlow.value, [0, 1], [0.9, 1.15]) }],
  }));

  const flagStyle = useAnimatedStyle(() => ({
    opacity: flagOpacity.value,
  }));

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: handTranslateY.value + handBob.value }, { rotate: `${handRotate.value}deg` }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardShake.value }, { scale: cardScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const checkPathProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - checkDraw.value),
  }));

  const pulse1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse1.value, [0, 0.2, 1], [0, 0.35, 0]),
    transform: [{ scale: interpolate(pulse1.value, [0, 1], [0.55, 2.3]) }],
  }));

  const pulse2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse2.value, [0, 0.2, 1], [0, 0.3, 0]),
    transform: [{ scale: interpolate(pulse2.value, [0, 1], [0.5, 2.6]) }],
  }));

  const pulse3Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse3.value, [0, 0.2, 1], [0, 0.26, 0]),
    transform: [{ scale: interpolate(pulse3.value, [0, 1], [0.48, 2.9]) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    letterSpacing: titleLetterSpacing.value,
    transform: [{ translateY: titleTranslateY.value }, { scale: titleScale.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: titleTranslateY.value * 0.55 }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const symbolStageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: symbolScale.value }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0, 0.22, 1], [0, 0.75, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, -36]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, -22]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle2Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.04, 0.26, 1], [0, 0.7, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, -50]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, -8]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle3Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.08, 0.3, 1], [0, 0.72, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, -22]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, -48]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle4Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.1, 0.32, 1], [0, 0.74, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, 10]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, -54]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle5Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.14, 0.36, 1], [0, 0.68, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, 34]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, -40]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle6Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.18, 0.38, 1], [0, 0.65, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, 50]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, -18]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle7Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.2, 0.4, 1], [0, 0.6, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, 42]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, 12]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const particle8Style = useAnimatedStyle(() => ({
    opacity: interpolate(particleBurst.value, [0.22, 0.42, 1], [0, 0.56, 0]),
    transform: [
      { translateX: interpolate(particleBurst.value, [0, 1], [0, -18]) },
      { translateY: interpolate(particleBurst.value, [0, 1], [0, 18]) },
      { scale: interpolate(particleBurst.value, [0, 1], [0.45, 1]) },
    ],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cardShine.value, [0, 1], [0, 0.2]),
    transform: [
      { translateX: interpolate(cardShine.value, [0, 1], [-30, 74]) },
      { rotate: '-18deg' },
    ],
  }));

  return (
    <View style={styles.root} accessibilityRole="image" accessibilityLabel="Animacja startowa aplikacji Powiat Decyduje">
      <LinearGradient
        colors={[brandColors.white, '#FFF3F3', brandColors.white]}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.flagLayer, flagStyle]} pointerEvents="none">
        <View style={styles.flagWhite} />
        <View style={styles.flagRed} />
      </Animated.View>

      <Animated.View style={[styles.glowOrb, glowStyle]} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Animated.View style={[styles.symbolStage, symbolStageStyle]}>
            <Animated.View style={[styles.pulseRing, pulse1Style]} />
            <Animated.View style={[styles.pulseRing, pulse2Style]} />
            <Animated.View style={[styles.pulseRing, pulse3Style]} />
            <Animated.View style={[styles.particleDot, styles.particle1, particle1Style]} />
            <Animated.View style={[styles.particleDot, styles.particle2, particle2Style]} />
            <Animated.View style={[styles.particleDot, styles.particle3, particle3Style]} />
            <Animated.View style={[styles.particleDot, styles.particle4, particle4Style]} />
            <Animated.View style={[styles.particleDot, styles.particle5, particle5Style]} />
            <Animated.View style={[styles.particleDot, styles.particle6, particle6Style]} />
            <Animated.View style={[styles.particleDot, styles.particle7, particle7Style]} />
            <Animated.View style={[styles.particleDot, styles.particle8, particle8Style]} />

            <Animated.View style={[styles.handLayer, handStyle]}>
              <Svg width={280} height={230} viewBox="0 0 280 230">
                <Rect x={48} y={176} width={64} height={48} rx={12} fill={brandColors.sleeve} />
                <Path d={HAND_PATH} fill={brandColors.hand} />
              </Svg>
            </Animated.View>

            <Animated.View style={[styles.cardLayer, cardStyle]}>
              <Animated.View style={checkStyle}>
                <Svg width={138} height={168} viewBox="0 0 138 168">
                  <Rect
                    x={10}
                    y={8}
                    width={116}
                    height={148}
                    rx={14}
                    fill={brandColors.white}
                    stroke={brandColors.border}
                    strokeWidth={2}
                  />
                  <Rect x={28} y={26} width={80} height={5} rx={2.5} fill="rgba(220, 20, 60, 0.17)" />
                  <Rect x={28} y={40} width={62} height={5} rx={2.5} fill="rgba(220, 20, 60, 0.14)" />
                  <AnimatedPath
                    d={CHECK_PATH}
                    stroke={brandColors.red}
                    strokeWidth={6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={CHECK_PATH_LENGTH}
                    animatedProps={checkPathProps}
                  />
                </Svg>
              </Animated.View>
              <Animated.View style={[styles.cardShine, shineStyle]} pointerEvents="none" />
            </Animated.View>
          </Animated.View>

          <View style={styles.textGroup}>
            <Animated.Text style={[styles.title, titleStyle]}>Powiat Decyduje</Animated.Text>
            <Animated.Text style={[styles.subtitle, subtitleStyle]}>Powiat Mławski</Animated.Text>
          </View>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  flagLayer: {
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
  glowOrb: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 230,
    alignSelf: 'center',
    bottom: -180,
    backgroundColor: 'rgba(220, 20, 60, 0.12)',
  },
  symbolStage: {
    width: 320,
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handLayer: {
    position: 'absolute',
    bottom: 20,
    left: 4,
  },
  cardLayer: {
    position: 'absolute',
    top: 24,
    right: 44,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: brandColors.red,
    top: 98,
    right: 94,
  },
  particleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brandColors.red,
  },
  particle1: {
    top: 112,
    right: 120,
  },
  particle2: {
    top: 116,
    right: 122,
    backgroundColor: brandColors.redStrong,
  },
  particle3: {
    top: 112,
    right: 124,
  },
  particle4: {
    top: 114,
    right: 124,
    backgroundColor: brandColors.redStrong,
  },
  particle5: {
    top: 110,
    right: 124,
  },
  particle6: {
    top: 116,
    right: 123,
    backgroundColor: brandColors.redStrong,
  },
  particle7: {
    top: 112,
    right: 123,
  },
  particle8: {
    top: 118,
    right: 123,
    backgroundColor: brandColors.redStrong,
  },
  cardShine: {
    position: 'absolute',
    width: 44,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    left: 10,
    top: -8,
    borderRadius: 12,
  },
  textGroup: {
    marginTop: 6,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: brandColors.text,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: brandColors.muted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brandColors.white,
  },
});
