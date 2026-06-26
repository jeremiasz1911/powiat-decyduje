import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type ScreenSectionProps = PropsWithChildren<{
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenSection({ title, description, children, style }: ScreenSectionProps) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children}
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
    ...appShadows.soft,
  },
  header: {
    gap: 4,
  },
  title: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  description: {
    color: appColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
