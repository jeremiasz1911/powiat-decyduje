import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';

export default function MapWebScreen() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmitProject = () => {
    setIsOpen(false);
    router.push({
      pathname: '/(drawer)/submit-project',
      params: { latitude: '53.1126', longitude: '20.3843' },
    });
  };

  const handleOpenProjects = () => {
    setIsOpen(false);
    router.push('/(drawer)/(tabs)/projects');
  };

  return (
    <ScreenContainer
      title="Mapa"
      description="Wersja web. Kliknij + w prawym dolnym rogu, aby przejsc do akcji.">
      <Text color="$textLight600">Szczegolowa mapa dziala na Android i iOS. Na webie udostepniamy szybkie akcje.</Text>

      <View style={styles.fabContainer}>
        {isOpen ? (
          <>
            <View style={styles.actionButtonWrap}>
              <Button onPress={handleOpenProjects} size="md" action="secondary" borderRadius="$full">
                <ButtonText>Przegladaj projekty</ButtonText>
              </Button>
            </View>

            <View style={styles.actionButtonWrap}>
              <Button onPress={handleSubmitProject} size="md" action="secondary" borderRadius="$full">
                <ButtonText>Zglos projekt</ButtonText>
              </Button>
            </View>
          </>
        ) : null}

        <Button onPress={() => setIsOpen((prev) => !prev)} size="lg" borderRadius="$full" bg="$blue600" style={styles.fabMain}>
          <Ionicons name={isOpen ? 'close' : 'add'} size={26} color="#fff" />
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'flex-end',
    gap: 10,
  },
  actionButtonWrap: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  fabMain: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },
});
