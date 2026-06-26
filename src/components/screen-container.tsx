import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/src/components/layout/app-screen';
import { useSettings } from '@/src/store/settings-context';
import { appColors, appTheme } from '@/src/theme/app-theme';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  description?: string;
  softOverlay?: boolean;
}>;

export function ScreenContainer({ title, description, children, softOverlay = false }: ScreenContainerProps) {
  const { fontScaleMultiplier } = useSettings();

  return (
    <AppScreen cherryBackground softOverlay={softOverlay} scroll contentContainerStyle={styles.content}>
      <View style={styles.headerPanel}>
        <Text style={[styles.title, { fontSize: 28 * fontScaleMultiplier }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { fontSize: 15 * fontScaleMultiplier }]}>{description}</Text>
        ) : null}
      </View>
      {children}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
    gap: appTheme.spacing.md,
  },
  headerPanel: {
    gap: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.xs,
  },
  title: {
    color: appColors.textPrimary,
    fontWeight: '900',
    lineHeight: 34,
  },
  description: {
    color: appColors.textMuted,
    lineHeight: 22,
  },
});
