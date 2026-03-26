import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

export default function MapWebScreen() {
  return (
    <Box flex={1} px="$4" py="$8" bg="$backgroundLight0">
      <VStack space="md">
        <Heading size="lg">Mapa</Heading>
        <Text>
          Podglad mapy jest dostepny w aplikacji natywnej (Android/iOS).
        </Text>
      </VStack>
    </Box>
  );
}
