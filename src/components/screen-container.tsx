import { PropsWithChildren, useContext } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import type { Edge } from 'react-native-safe-area-context';

import { AppScreen } from '@/src/components/layout/app-screen';
import { useSettings } from '@/src/store/settings-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  description?: string;
  softOverlay?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({
  title,
  description,
  children,
  softOverlay = false,
  contentContainerStyle,
}: ScreenContainerProps) {
  const { fontScaleMultiplier } = useSettings();
  const { colors } = useAppTheme();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const edges: Edge[] = tabBarHeight > 0 ? [] : ['bottom'];

  return (
    <AppScreen
      cherryBackground
      softOverlay={softOverlay}
      scroll
      edges={edges}
      contentContainerStyle={[styles.content, contentContainerStyle]}>
      <View style={styles.headerPanel}>
        <Text style={[styles.title, { fontSize: 24 * fontScaleMultiplier, color: colors.textPrimary }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { fontSize: 15 * fontScaleMultiplier, color: colors.textMuted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.xl,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
    gap: appTheme.spacing.lg,
  },
  headerPanel: {
    gap: appTheme.spacing.xs,
    paddingBottom: appTheme.spacing.xs,
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  description: {
    lineHeight: 22,
  },
});
