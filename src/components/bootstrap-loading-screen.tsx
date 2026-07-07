import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useBootstrapTheme } from '@/src/theme/use-bootstrap-theme';

type BootstrapLoadingScreenProps = {
  label?: string;
};

export function BootstrapLoadingScreen({ label }: BootstrapLoadingScreenProps) {
  const { colors } = useBootstrapTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel={label ?? 'Ładowanie'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
