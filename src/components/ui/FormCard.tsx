import { PropsWithChildren, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type FormCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function FormCard({ children, style }: FormCardProps) {
  const { colors, shadows } = useAppTheme();
  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: appTheme.spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.soft,
    }),
    [colors, shadows]
  );

  return <View style={[cardStyle, style]}>{children}</View>;
}
