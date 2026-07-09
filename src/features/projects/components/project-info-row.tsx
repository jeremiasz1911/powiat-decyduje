import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors, appTheme } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ProjectInfoRowProps = {
  icon: IoniconName;
  label: string;
  value: string;
};

export function ProjectInfoRow({ icon, label, value }: ProjectInfoRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={16} color={appColors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
    marginTop: 1,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  value: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
});
