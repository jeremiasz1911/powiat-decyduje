import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';

/** Semi-transparent veil over decorative backgrounds — keeps forms readable. */
export function AuthScreenOverlay() {
  const { colors, colorScheme } = useAppTheme();

  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor: colors.background,
          opacity: colorScheme === 'dark' ? 0.72 : 0.2,
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
