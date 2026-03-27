import { PropsWithChildren } from 'react';
import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

import { useSettings } from '@/src/store/settings-context';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ScreenContainer({ title, description, children }: ScreenContainerProps) {
  const { fontScaleMultiplier } = useSettings();

  return (
    <Box flex={1} px="$4" py="$6" bg="$backgroundLight0">
      <VStack space="md">
        <Heading size="lg" style={{ fontSize: 24 * fontScaleMultiplier }}>
          {title}
        </Heading>
        {description ? <Text color="$textLight600" style={{ fontSize: 14 * fontScaleMultiplier }}>{description}</Text> : null}
        {children}
      </VStack>
    </Box>
  );
}
