import { Box, Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { useAuthContext } from '@/src/store/auth-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function SelectResidentAccountScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { residentAccounts, activeResidentAccountId, setActiveResidentAccountId, refreshResidentAccounts } =
    useAuthContext();
  const [isWorking, setIsWorking] = useState(false);

  const handleSelect = async (accountId: string) => {
    setIsWorking(true);

    try {
      await refreshResidentAccounts();
      await setActiveResidentAccountId(accountId);

      await notify('Konto wybrane', 'Wybrany profil mieszkańca jest aktywny.', 'success');
      router.replace('/(drawer)/(tabs)/projects');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się przełączyć konta.';
      await notify('Błąd wyboru konta', message, 'error');
    } finally {
      setIsWorking(false);
    }
  };

  const handleBack = async () => {
    router.back();
  };

  return (
    <ScreenContainer
      title="Wybierz profil mieszkańca"
      description="Ten numer telefonu ma kilka profili. Wybierz ten, którego chcesz używać teraz.">
      <Box style={styles.card}>
        <VStack space="sm">
          {residentAccounts.length === 0 ? (
            <Text style={styles.emptyText}>Nie znaleziono profili przypisanych do tego konta.</Text>
          ) : (
            residentAccounts.map((account) => (
              <Button
                key={account.id}
                onPress={() => {
                  void handleSelect(account.id);
                }}
                isDisabled={isWorking}
                style={[
                  styles.accountButton,
                  account.id === activeResidentAccountId ? styles.accountButtonActive : null,
                ]}>
                <VStack space="xs">
                  <ButtonText
                    style={[
                      styles.accountButtonText,
                      account.id === activeResidentAccountId ? styles.accountButtonTextActive : null,
                    ]}>
                    {account.label ?? account.fullName}
                  </ButtonText>
                  <Text style={styles.accountMeta}>
                    PESEL {account.pesel} • {account.phoneNumber}
                  </Text>
                </VStack>
              </Button>
            ))
          )}

          <Button variant="outline" onPress={() => void handleBack()} style={styles.backButton}>
            <ButtonText style={styles.backButtonText}>Wróć</ButtonText>
          </Button>
        </VStack>
      </Box>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 20,
    padding: 16,
    ...futuristicShadows.soft,
  },
  emptyText: {
    color: futuristicTheme.colors.warning,
    fontSize: 14,
  },
  accountButton: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    borderRadius: 16,
    backgroundColor: futuristicTheme.colors.panelSoft,
    alignItems: 'flex-start',
  },
  accountButtonActive: {
    backgroundColor: futuristicTheme.colors.accent,
    borderColor: futuristicTheme.colors.accentStrong,
    ...futuristicShadows.glow,
  },
  accountButtonText: {
    color: futuristicTheme.colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  accountButtonTextActive: {
    color: futuristicTheme.colors.textDark,
  },
  accountMeta: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 12,
  },
  backButton: {
    borderRadius: 14,
  },
  backButtonText: {
    color: futuristicTheme.colors.textMuted,
  },
});
