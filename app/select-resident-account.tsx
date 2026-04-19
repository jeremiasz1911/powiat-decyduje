import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { useAuthContext } from '@/src/store/auth-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function SelectResidentAccountScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { residentAccounts, activeResidentAccountId, setActiveResidentAccountId } = useAuthContext();
  const [isSwitching, setIsSwitching] = useState(false);

  const onSelectAccount = async (accountId: string) => {
    setIsSwitching(true);
    try {
      await setActiveResidentAccountId(accountId);
      await notify('Konto wybrane', 'Zalogowano jako wybrany mieszkaniec.', 'success');
      router.replace('/(drawer)/(tabs)/projects');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie ustawic aktywnego konta.';
      await notify('Blad wyboru konta', message, 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <ScreenContainer
      title="Wybierz konto mieszkanca"
      description="Ten numer telefonu jest powiazany z kontami mieszkancow. Wybierz konto, aby zalogowac sie lub odzyskac dostep.">
      <Box style={styles.formCard}>
        <VStack space="md">
          {!residentAccounts.length ? (
            <Text color={futuristicTheme.colors.warning}>
              Brak kont mieszkancow powiazanych z tym numerem telefonu.
            </Text>
          ) : (
            residentAccounts.map((account) => (
              <Button
                key={account.id}
                onPress={() => {
                  void onSelectAccount(account.id);
                }}
                isDisabled={isSwitching}
                style={[
                  styles.accountButton,
                  account.id === activeResidentAccountId ? styles.accountButtonActive : null,
                ]}>
                <ButtonText
                  color={
                    account.id === activeResidentAccountId
                      ? futuristicTheme.colors.textDark
                      : futuristicTheme.colors.textPrimary
                  }>
                  {account.label}
                </ButtonText>
              </Button>
            ))
          )}
        </VStack>
      </Box>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formCard: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 16,
    padding: 14,
    ...futuristicShadows.soft,
  },
  accountButton: {
    borderColor: futuristicTheme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: futuristicTheme.colors.panelSoft,
  },
  accountButtonActive: {
    backgroundColor: futuristicTheme.colors.accent,
    borderColor: futuristicTheme.colors.accentStrong,
    ...futuristicShadows.glow,
  },
});
