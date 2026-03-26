import { PropsWithChildren } from 'react';
import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

type ScreenContainerProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ScreenContainer({ title, description, children }: ScreenContainerProps) {
  return (
    <Box flex={1} px="$4" py="$6" bg="$backgroundLight0">
      <VStack space="md">
        <Heading size="lg">{title}</Heading>
        {description ? <Text color="$textLight600">{description}</Text> : null}
        {children}
      </VStack>
    </Box>
  );
}
