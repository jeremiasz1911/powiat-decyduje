import { StyleSheet, View } from 'react-native';

import { appColors } from '@/src/theme/app-theme';

/** Semi-transparent veil over decorative backgrounds — keeps forms readable. */
export function AuthScreenOverlay() {
  return <View style={styles.overlay} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: appColors.background,
    opacity: 0.2,
  },
});
