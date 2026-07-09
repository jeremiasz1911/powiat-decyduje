import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SubmitFormSectionProps = {
  icon: IoniconName;
  title: string;
  description?: string;
  error?: string;
  children: ReactNode;
};

export function SubmitFormSection({ icon, title, description, error, children }: SubmitFormSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.section,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: appTheme.spacing.md,
    borderWidth: 1,
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
    marginTop: 1,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  body: {
    gap: appTheme.spacing.md,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
});
