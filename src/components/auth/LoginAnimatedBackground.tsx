import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { appColors } from '@/src/theme/app-theme';

const SWEEP_CYCLE_MS = 18600;
const SWEEP_DURATION_MS = 15600;
const FLOAT_CYCLE_MS = 17200;
const OFF_SCREEN_PAD = 56;

type SlashLineConfig = {
  top: `${number}%`;
  rotateDeg: number;
  lineLength: number;
  delayMs: number;
  floatOffset: number;
};

type SlashSweepLineProps = SlashLineConfig & {
  containerHalf: number;
};

function SlashSweepLine({
  top,
  rotateDeg,
  lineLength,
  delayMs,
  floatOffset,
  containerHalf,
}: SlashSweepLineProps) {
  const sweep = useSharedValue(0);
  const float = useSharedValue(0);
  const travel = containerHalf + lineLength * 0.5 + OFF_SCREEN_PAD;

  useEffect(() => {
    const pauseMs = Math.max(SWEEP_CYCLE_MS - SWEEP_DURATION_MS, 1400);

    sweep.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: SWEEP_DURATION_MS, easing: Easing.inOut(Easing.cubic) }),
          withTiming(1, { duration: pauseMs }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    float.value = withDelay(
      floatOffset,
      withRepeat(
        withTiming(1, { duration: FLOAT_CYCLE_MS, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [delayMs, float, floatOffset, sweep]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      sweep.value,
      [0, 0.08, 0.2, 0.5, 0.8, 0.92, 1],
      [0, 0, 0.58, 0.74, 0.58, 0, 0]
    ),
    transform: [
      { rotate: `${rotateDeg}deg` },
      { translateX: interpolate(sweep.value, [0, 1], [-travel, travel]) },
      { translateY: interpolate(float.value, [0, 1], [-4, 4]) },
    ],
  }));

  return (
    <Animated.View style={[styles.slashRow, { top }, style]}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.95)',
          'rgba(227, 6, 19, 0.72)',
          'rgba(255, 255, 255, 0.95)',
          'rgba(255, 255, 255, 0)',
        ]}
        locations={[0, 0.28, 0.5, 0.72, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.slashLine, { width: lineLength }]}
      />
    </Animated.View>
  );
}

const LOGO_SLASH_LINES: SlashLineConfig[] = [
  { top: '8%', rotateDeg: -32, lineLength: 0, delayMs: 0, floatOffset: 0 },
  { top: '24%', rotateDeg: -26, lineLength: 0, delayMs: 1100, floatOffset: 600 },
  { top: '42%', rotateDeg: -30, lineLength: 0, delayMs: 2200, floatOffset: 1400 },
  { top: '58%', rotateDeg: -24, lineLength: 0, delayMs: 550, floatOffset: 1800 },
  { top: '74%', rotateDeg: -28, lineLength: 0, delayMs: 3300, floatOffset: 900 },
];

type LoginSlashLinesProps = {
  scope?: 'screen' | 'logo';
  logoWidth?: number;
};

export function LoginSlashLines({ scope = 'screen', logoWidth }: LoginSlashLinesProps) {
  const { width: screenWidth } = useWindowDimensions();
  const containerHalf = scope === 'logo' ? (logoWidth ?? screenWidth * 0.5) / 2 : screenWidth / 2;
  const lineScale = scope === 'logo' ? (logoWidth ?? screenWidth * 0.5) / 220 : 1;

  const lines: SlashLineConfig[] =
    scope === 'logo'
      ? LOGO_SLASH_LINES.map((line) => ({
          ...line,
          lineLength: Math.round(150 * lineScale),
        }))
      : [
          { top: '16%', rotateDeg: -30, lineLength: 190, delayMs: 0, floatOffset: 0 },
          { top: '30%', rotateDeg: -24, lineLength: 160, delayMs: 1400, floatOffset: 800 },
          { top: '44%', rotateDeg: -28, lineLength: 175, delayMs: 2800, floatOffset: 1600 },
          { top: '56%', rotateDeg: -22, lineLength: 145, delayMs: 900, floatOffset: 500 },
          { top: '68%', rotateDeg: -26, lineLength: 165, delayMs: 4200, floatOffset: 1200 },
        ];

  return (
    <View style={styles.slashLayer} pointerEvents="none">
      {lines.map((line) => (
        <SlashSweepLine key={`${line.top}-${line.delayMs}`} {...line} containerHalf={containerHalf} />
      ))}
    </View>
  );
}

export function LoginAnimatedBackground() {
  const ambient = useSharedValue(0);

  useEffect(() => {
    ambient.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [ambient]);

  const softGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ambient.value, [0, 0.5, 1], [0.07, 0.12, 0.07]),
  }));

  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={['#FFFFFF', '#FFF7F7', '#FFF1F3', '#FFFFFF']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.softGlow, softGlowStyle]} />

      <View style={[styles.ring, styles.ringOne]} />
      <View style={[styles.ring, styles.ringTwo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  softGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '6%',
    alignSelf: 'center',
    backgroundColor: appColors.cherrySoft,
  },
  slashLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  slashRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slashLine: {
    height: 4,
    borderRadius: 4,
    shadowColor: appColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: appColors.cherryLine,
    borderRadius: 999,
    backgroundColor: 'transparent',
    opacity: 0.1,
  },
  ringOne: {
    width: 72,
    height: 72,
    top: '14%',
    left: '8%',
  },
  ringTwo: {
    width: 52,
    height: 52,
    bottom: '14%',
    right: '10%',
  },
});
