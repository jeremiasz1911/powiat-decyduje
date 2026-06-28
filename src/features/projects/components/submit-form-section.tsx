import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { appColors, appTheme } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SubmitFormSectionProps = {
  icon: IoniconName;
  title: string;
  description?: string;
  error?: string;
  children: ReactNode;
};

export function SubmitFormSection({ icon, title, description, error, children }: SubmitFormSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={appColors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 16,
    padding: appTheme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
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
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  body: {
    gap: appTheme.spacing.md,
  },
  error: {
    color: appColors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
