import Svg, { Path } from 'react-native-svg';
import Animated, { type SharedValue, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';

import { brandColors } from '@/src/theme/brand';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const LOGO_VIEWBOX = 72;
const RING_RADIUS = 28;
const RING_STROKE = 2.5;
const CENTER = LOGO_VIEWBOX / 2;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const CHECKMARK_PATH = 'M 24 37 L 33 46 L 48 28';

function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`;
}

const RING_PATH = circlePath(CENTER, CENTER, RING_RADIUS);
const DOT_PATH = circlePath(CENTER, CENTER, 4);

type PowiatLogoSymbolProps = {
  size: number;
  ringDraw: SharedValue<number>;
  checkOpacity: SharedValue<number>;
  ringRotation: SharedValue<number>;
};

export function PowiatLogoSymbol({ size, ringDraw, checkOpacity, ringRotation }: PowiatLogoSymbolProps) {
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - ringDraw.value),
    opacity: 0.35 + ringDraw.value * 0.65,
  }));

  const checkProps = useAnimatedProps(() => ({
    opacity: checkOpacity.value,
  }));

  const symbolStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size }, symbolStyle]}
      accessible={false}
      importantForAccessibility="no">
      <Svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}>
        <AnimatedPath
          d={RING_PATH}
          stroke={brandColors.red}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={ringProps}
        />
        <Path d={DOT_PATH} fill={brandColors.redStrong} opacity={0.85} />
        <AnimatedPath
          d={CHECKMARK_PATH}
          stroke={brandColors.red}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={checkProps}
        />
      </Svg>
    </Animated.View>
  );
}

type StaticPowiatLogoSymbolProps = {
  size: number;
};

export function StaticPowiatLogoSymbol({ size }: StaticPowiatLogoSymbolProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}>
      <Path
        d={RING_PATH}
        stroke={brandColors.red}
        strokeWidth={RING_STROKE}
        fill="none"
        strokeLinecap="round"
      />
      <Path d={DOT_PATH} fill={brandColors.redStrong} opacity={0.85} />
      <Path
        d={CHECKMARK_PATH}
        stroke={brandColors.red}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
