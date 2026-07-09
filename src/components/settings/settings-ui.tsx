import { Ionicons } from '@expo/vector-icons';
import { Children, Fragment, isValidElement, useMemo, type ComponentProps, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { appTheme } from '@/src/theme/app-theme';
import { useAppTheme } from '@/src/theme/theme-context';
import type { AppColorTokens } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type SettingsSurfaceVariant = 'flat' | 'card';

function createStyles(colors: AppColorTokens, shadows: typeof import('@/src/theme/app-theme').appShadows) {
  return StyleSheet.create({
    group: {
      gap: appTheme.spacing.sm,
    },
    groupTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '800',
      paddingHorizontal: 0,
      marginBottom: appTheme.spacing.xs,
    },
    groupFooter: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: 0,
      marginTop: appTheme.spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.soft,
    },
    cardFlat: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      borderWidth: 0,
      overflow: 'visible',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 52,
    },
    separatorFlat: {
      marginLeft: 0,
    },
    row: {
      minHeight: 48,
      paddingHorizontal: 0,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: appTheme.spacing.sm,
    },
    rowPressed: {
      opacity: 0.72,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    iconWrapDanger: {
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
    },
    rowLabel: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 20,
    },
    rowLabelDanger: {
      color: colors.danger,
    },
    rowLabelDisabled: {
      color: colors.textMuted,
    },
    rowTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '46%',
    },
    rowValue: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'right',
    },
  });
}

function useSettingsStyles() {
  const { colors, shadows } = useAppTheme();
  return useMemo(() => createStyles(colors, shadows), [colors, shadows]);
}

type SettingsGroupProps = PropsWithChildren<{
  title?: string;
  footer?: string;
}>;

export function SettingsGroup({ title, footer, children }: SettingsGroupProps) {
  const styles = useSettingsStyles();

  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      {children}
      {footer ? <Text style={styles.groupFooter}>{footer}</Text> : null}
    </View>
  );
}

type SettingsCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: SettingsSurfaceVariant;
}>;

export function SettingsCard({ children, style, variant = 'flat' }: SettingsCardProps) {
  const styles = useSettingsStyles();
  const items = Children.toArray(children).filter(Boolean);
  const isFlat = variant === 'flat';

  return (
    <View style={[isFlat ? styles.cardFlat : styles.card, style]}>
      {items.map((child, index) => (
        <Fragment key={isValidElement(child) && child.key != null ? String(child.key) : index}>
          {child}
          {index < items.length - 1 ? (
            <View style={[styles.separator, isFlat ? styles.separatorFlat : null]} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  icon?: IoniconName;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  trailing?: ReactNode;
};

export function SettingsRow({
  label,
  icon,
  value,
  onPress,
  showChevron = Boolean(onPress),
  destructive = false,
  disabled = false,
  loading = false,
  trailing,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const styles = useSettingsStyles();

  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, destructive ? styles.iconWrapDanger : null]}>
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? colors.danger : colors.primary}
          />
        </View>
      ) : null}

      <Text
        style={[
          styles.rowLabel,
          destructive ? styles.rowLabelDanger : null,
          disabled ? styles.rowLabelDisabled : null,
        ]}
        numberOfLines={2}>
        {label}
      </Text>

      <View style={styles.rowTrailing}>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        {!loading && value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {!loading && trailing}
        {!loading && showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.row, pressed && !disabled ? styles.rowPressed : null]}>
      {content}
    </Pressable>
  );
}

type SettingsCheckRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IoniconName;
};

export function SettingsCheckRow({ label, selected, onPress, icon }: SettingsCheckRowProps) {
  const { colors } = useAppTheme();
  const styles = useSettingsStyles();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      ) : null}
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowTrailing}>
        {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
      </View>
    </Pressable>
  );
}

type SettingsSwitchRowProps = {
  label: string;
  icon?: IoniconName;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SettingsSwitchRow({
  label,
  icon,
  value,
  onValueChange,
  disabled = false,
}: SettingsSwitchRowProps) {
  const { colors } = useAppTheme();
  const styles = useSettingsStyles();

  return (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      ) : null}
      <Text style={[styles.rowLabel, disabled ? styles.rowLabelDisabled : null]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.cherryLine }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

export function SettingsDivider() {
  const { colors } = useAppTheme();

  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: appTheme.spacing.md }} />;
}
