import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';
import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';

import { AppScreen } from '@/src/components/layout/app-screen';
import { useSettings } from '@/src/store/settings-context';
import { futuristicTheme } from '@/src/theme/futuristic';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ScreenContainer({ title, description, children }: ScreenContainerProps) {
  const { fontScaleMultiplier } = useSettings();

  return (
    <AppScreen
      gradientColors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]}
      contentContainerStyle={styles.content}>
      <VStack space="md">
        <Box style={styles.headerPanel}>
          <VStack space="xs">
            <Heading size="lg" color={futuristicTheme.colors.textPrimary} style={{ fontSize: 24 * fontScaleMultiplier }}>
              {title}
            </Heading>
            {description ? (
              <Text color={futuristicTheme.colors.textMuted} style={{ fontSize: 14 * fontScaleMultiplier }}>
                {description}
              </Text>
            ) : null}
          </VStack>
        </Box>
        {children}
      </VStack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerPanel: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderRadius: 18,
    padding: 14,
  },
});
