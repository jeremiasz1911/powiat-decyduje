import { Ionicons } from '@expo/vector-icons';
import { Children, Fragment, isValidElement, type ComponentProps, type PropsWithChildren, type ReactNode } from 'react';
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

import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SettingsGroupProps = PropsWithChildren<{
  title?: string;
  footer?: string;
}>;

export function SettingsGroup({ title, footer, children }: SettingsGroupProps) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      {children}
      {footer ? <Text style={styles.groupFooter}>{footer}</Text> : null}
    </View>
  );
}

export function SettingsCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.card, style]}>
      {items.map((child, index) => (
        <Fragment key={isValidElement(child) && child.key != null ? String(child.key) : index}>
          {child}
          {index < items.length - 1 ? <View style={styles.separator} /> : null}
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
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, destructive ? styles.iconWrapDanger : null]}>
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? appColors.danger : appColors.primary}
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
        {loading ? <ActivityIndicator size="small" color={appColors.primary} /> : null}
        {!loading && value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {!loading && trailing}
        {!loading && showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={16} color={appColors.textMuted} />
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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={appColors.primary} />
        </View>
      ) : null}
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowTrailing}>
        {selected ? <Ionicons name="checkmark" size={18} color={appColors.primary} /> : null}
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
  return (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={appColors.primary} />
        </View>
      ) : null}
      <Text style={[styles.rowLabel, disabled ? styles.rowLabelDisabled : null]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: appColors.border, true: appColors.cherryLine }}
        thumbColor={value ? appColors.primary : appColors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: appTheme.spacing.xs,
  },
  groupTitle: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  groupFooter: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    overflow: 'hidden',
    ...appShadows.soft,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: appColors.border,
    marginLeft: 52,
  },
  row: {
    minHeight: 48,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  rowPressed: {
    backgroundColor: appColors.surfaceSoft,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  rowLabel: {
    flex: 1,
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  rowLabelDanger: {
    color: appColors.danger,
  },
  rowLabelDisabled: {
    color: appColors.textMuted,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '46%',
  },
  rowValue: {
    color: appColors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
});
