import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type VoteAnonymousToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function VoteAnonymousToggle({ value, onValueChange, disabled = false }: VoteAnonymousToggleProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={({ pressed }) => [
        styles.wrap,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        pressed && !disabled ? styles.pressed : null,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="eye-off-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Oddaj głos anonimowo</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Twój głos zostanie policzony, ale Twoje dane nie będą widoczne publicznie.
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.surfaceSoft}
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
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
});
