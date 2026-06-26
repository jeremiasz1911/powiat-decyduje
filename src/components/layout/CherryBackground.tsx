import { StyleSheet, View } from 'react-native';

import { appColors } from '@/src/theme/app-theme';

export function CherryBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.petal, styles.petalOne]} />
      <View style={[styles.petal, styles.petalTwo]} />
      <View style={[styles.petal, styles.petalThree]} />
      <View style={[styles.circle, styles.circleOne]} />
      <View style={[styles.circle, styles.circleTwo]} />
      <View style={[styles.line, styles.lineOne]} />
      <View style={[styles.line, styles.lineTwo]} />
      <View style={[styles.dot, styles.dotOne]} />
      <View style={[styles.dot, styles.dotTwo]} />
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
    backgroundColor: appColors.cherrySoft,
  },
  petalOne: {
    width: 90,
    height: 32,
    top: '10%',
    right: -12,
    opacity: 0.16,
    transform: [{ rotate: '-24deg' }],
  },
  petalTwo: {
    width: 72,
    height: 26,
    top: '34%',
    left: -18,
    opacity: 0.12,
    transform: [{ rotate: '18deg' }],
  },
  petalThree: {
    width: 64,
    height: 22,
    bottom: '18%',
    right: '8%',
    opacity: 0.1,
    transform: [{ rotate: '-12deg' }],
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.cherryLine,
    backgroundColor: 'transparent',
  },
  circleOne: {
    width: 120,
    height: 120,
    top: -30,
    left: -24,
    opacity: 0.14,
  },
  circleTwo: {
    width: 88,
    height: 88,
    bottom: '12%',
    left: '10%',
    opacity: 0.1,
  },
  line: {
    position: 'absolute',
    height: 1,
    backgroundColor: appColors.cherryLine,
  },
  lineOne: {
    width: 110,
    top: '22%',
    left: -20,
    opacity: 0.18,
    transform: [{ rotate: '-16deg' }],
  },
  lineTwo: {
    width: 96,
    bottom: '28%',
    right: -10,
    opacity: 0.14,
    transform: [{ rotate: '14deg' }],
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: appColors.cherry,
    opacity: 0.12,
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
