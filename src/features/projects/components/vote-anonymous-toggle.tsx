import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { appColors, appTheme } from '@/src/theme/app-theme';

type VoteAnonymousToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function VoteAnonymousToggle({ value, onValueChange, disabled = false }: VoteAnonymousToggleProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={({ pressed }) => [styles.wrap, pressed && !disabled ? styles.pressed : null]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}>
      <View style={styles.iconWrap}>
        <Ionicons name="eye-off-outline" size={16} color={appColors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Oddaj głos anonimowo</Text>
        <Text style={styles.description}>
          Twój głos zostanie policzony, ale Twoje dane nie będą widoczne publicznie.
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: appColors.border, true: appColors.primarySoft }}
        thumbColor={value ? appColors.primary : appColors.surface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 14,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
