import { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

import { useSettings } from '@/src/store/settings-context';
import { futuristicTheme } from '@/src/theme/futuristic';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ScreenContainer({ title, description, children }: ScreenContainerProps) {
  const { fontScaleMultiplier } = useSettings();

  return (
    <LinearGradient colors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]} style={styles.gradient}>
      <Box flex={1} px="$4" py="$6">
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
      </Box>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  headerPanel: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderRadius: 18,
    padding: 14,
  },
});
