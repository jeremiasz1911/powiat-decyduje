import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { appShadows, appTheme } from '@/src/theme/app-theme';

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
      <Text color={appTheme.colors.textMuted}>Szczegolowa mapa dziala na Android i iOS. Na webie udostepniamy szybkie akcje.</Text>

      <View style={styles.fabContainer}>
        {isOpen ? (
          <>
            <View style={styles.actionButtonWrap}>
              <Button onPress={handleOpenProjects} size="md" action="secondary" borderRadius="$full" bg={appTheme.colors.surface}>
                <ButtonText color={appTheme.colors.primary}>Przegladaj projekty</ButtonText>
              </Button>
            </View>

            <View style={styles.actionButtonWrap}>
              <Button onPress={handleSubmitProject} size="md" action="secondary" borderRadius="$full" bg={appTheme.colors.surface}>
                <ButtonText color={appTheme.colors.primary}>Zglos projekt</ButtonText>
              </Button>
            </View>
          </>
        ) : null}

        <Button onPress={() => setIsOpen((prev) => !prev)} size="lg" borderRadius="$full" bg={appTheme.colors.primary} style={styles.fabMain}>
          <Ionicons name={isOpen ? 'close' : 'add'} size={26} color={appTheme.colors.textDark} />
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
    ...appShadows.soft,
  },
  fabMain: {
    ...appShadows.button,
  },
});
