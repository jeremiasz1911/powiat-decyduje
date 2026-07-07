import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme, type ResolvedColorScheme } from '@/src/theme/theme-context';

function decorOpacity(colorScheme: ResolvedColorScheme) {
  if (colorScheme === 'light') {
    return {
      petalOne: 0.22,
      petalTwo: 0.17,
      petalThree: 0.14,
      circleOne: 0.18,
      circleTwo: 0.13,
      lineOne: 0.24,
      lineTwo: 0.18,
      dot: 0.15,
    };
  }

  return {
    petalOne: 0.16,
    petalTwo: 0.12,
    petalThree: 0.1,
    circleOne: 0.14,
    circleTwo: 0.1,
    lineOne: 0.18,
    lineTwo: 0.14,
    dot: 0.12,
  };
}

export function CherryBackground() {
  const { colors, colorScheme } = useAppTheme();
  const opacity = useMemo(() => decorOpacity(colorScheme), [colorScheme]);

  return (
    <View style={styles.root} pointerEvents="none">
      <View
        style={[
          styles.petal,
          styles.petalOne,
          { backgroundColor: colors.cherrySoft, opacity: opacity.petalOne },
        ]}
      />
      <View
        style={[
          styles.petal,
          styles.petalTwo,
          { backgroundColor: colors.cherrySoft, opacity: opacity.petalTwo },
        ]}
      />
      <View
        style={[
          styles.petal,
          styles.petalThree,
          { backgroundColor: colors.cherrySoft, opacity: opacity.petalThree },
        ]}
      />
      <View
        style={[
          styles.circle,
          styles.circleOne,
          { borderColor: colors.cherryLine, opacity: opacity.circleOne },
        ]}
      />
      <View
        style={[
          styles.circle,
          styles.circleTwo,
          { borderColor: colors.cherryLine, opacity: opacity.circleTwo },
        ]}
      />
      <View
        style={[
          styles.line,
          styles.lineOne,
          { backgroundColor: colors.cherryLine, opacity: opacity.lineOne },
        ]}
      />
      <View
        style={[
          styles.line,
          styles.lineTwo,
          { backgroundColor: colors.cherryLine, opacity: opacity.lineTwo },
        ]}
      />
      <View
        style={[styles.dot, styles.dotOne, { backgroundColor: colors.cherry, opacity: opacity.dot }]}
      />
      <View
        style={[styles.dot, styles.dotTwo, { backgroundColor: colors.cherry, opacity: opacity.dot }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  petal: {
    position: 'absolute',
    borderRadius: 999,
  },
  petalOne: {
    width: 90,
    height: 32,
    top: '10%',
    right: -12,
    transform: [{ rotate: '-24deg' }],
  },
  petalTwo: {
    width: 72,
    height: 26,
    top: '34%',
    left: -18,
    transform: [{ rotate: '18deg' }],
  },
  petalThree: {
    width: 64,
    height: 22,
    bottom: '18%',
    right: '8%',
    transform: [{ rotate: '-12deg' }],
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  circleOne: {
    width: 120,
    height: 120,
    top: -30,
    left: -24,
  },
  circleTwo: {
    width: 88,
    height: 88,
    bottom: '12%',
    left: '10%',
  },
  line: {
    position: 'absolute',
    height: 1,
  },
  lineOne: {
    width: 110,
    top: '22%',
    left: -20,
    transform: [{ rotate: '-16deg' }],
  },
  lineTwo: {
    width: 96,
    bottom: '28%',
    right: -10,
    transform: [{ rotate: '14deg' }],
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
  },
  dotOne: {
    width: 6,
    height: 6,
    top: '48%',
    right: '14%',
  },
  dotTwo: {
    width: 5,
    height: 5,
    bottom: '36%',
    left: '18%',
  },
});
