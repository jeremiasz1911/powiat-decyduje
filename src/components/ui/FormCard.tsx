import { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { formStyles } from '@/src/theme/app-theme';

type FormCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function FormCard({ children, style }: FormCardProps) {
  return <View style={[formStyles.card, style]}>{children}</View>;
}
