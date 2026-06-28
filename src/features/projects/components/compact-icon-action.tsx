import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { appColors } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type CompactIconActionProps = {
  icon: IoniconName;
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function CompactIconAction({
  icon,
  label,
  onPress,
  accessibilityLabel,
  variant = 'default',
  disabled = false,
  loading = false,
  style,
}: CompactIconActionProps) {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        label ? styles.withLabel : styles.iconOnly,
        variantStyle.button,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.iconColor} />
      ) : (
        <Ionicons name={icon} size={label ? 15 : 17} color={variantStyle.iconColor} />
      )}
      {label ? <Text style={[styles.label, { color: variantStyle.iconColor }]}>{label}</Text> : null}
    </Pressable>
  );
}

const VARIANT_STYLES = {
  default: {
    button: {
      backgroundColor: appColors.surfaceSoft,
      borderWidth: 1,
      borderColor: appColors.border,
    },
    iconColor: appColors.textSecondary,
  },
  primary: {
    button: {
      backgroundColor: appColors.primarySoft,
      borderWidth: 1,
      borderColor: 'rgba(227, 6, 19, 0.18)',
    },
    iconColor: appColors.primary,
  },
  danger: {
    button: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    iconColor: appColors.danger,
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    iconColor: appColors.textMuted,
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconOnly: {
    width: 34,
    height: 34,
  },
  withLabel: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 34,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
