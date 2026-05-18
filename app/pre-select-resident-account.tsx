import { Box, Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { sendResidentPhoneVerificationCode } from '@/src/services';
import { useAuthFlow } from '@/src/store/auth-flow-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function PreSelectResidentAccountScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { pendingPhoneLogin, setPhoneLoginSelectedAccount } = useAuthFlow();
  const [isWorking, setIsWorking] = useState(false);

  if (!pendingPhoneLogin) {
    router.replace('/login-phone');
    return null;
  }

  const handleSelectAccount = async (accountId: string) => {
    setIsWorking(true);

    try {
      setPhoneLoginSelectedAccount(accountId);
      await notify('Konto wybrane', 'Wybrany profil mieszkańca. Wysyłamy SMS...', 'success');

      try {
        const verification = await sendResidentPhoneVerificationCode({ phoneNumber: pendingPhoneLogin.phoneNumber });
        router.push({
          pathname: '/verify-resident-phone',
          params: {
            mode: 'login',
            phoneNumber: verification.normalizedPhoneNumber,
            verificationId: verification.verificationId,
          },
        });
      } catch (smsError) {
        const smsMessage = smsError instanceof Error ? smsError.message : 'Nie udało się wysłać kodu SMS.';
        await notify('Błąd SMS', smsMessage, 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się wybrać konta.';
      await notify('Błąd wyboru konta', message, 'error');
    } finally {
      setIsWorking(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScreenContainer
      title="Wybierz profil mieszkańca"
      description="Ten numer telefonu ma kilka profili. Wybierz ten, którego chcesz używać do logowania.">
      <Box style={styles.card}>
        <VStack space="sm">
          {pendingPhoneLogin.residentAccounts.length === 0 ? (
            <Text style={styles.emptyText}>Nie znaleziono profili przypisanych do tego numeru telefonu.</Text>
          ) : (
            pendingPhoneLogin.residentAccounts.map((account) => (
              <Button
                key={account.id}
                onPress={() => {
                  void handleSelectAccount(account.id);
                }}
                isDisabled={isWorking}
                style={[
                  styles.accountButton,
                  account.id === pendingPhoneLogin.selectedResidentAccountId ? styles.accountButtonActive : null,
                ]}>
                <VStack space="xs">
                  <ButtonText
                    style={[
                      styles.accountButtonText,
                      account.id === pendingPhoneLogin.selectedResidentAccountId
                        ? styles.accountButtonTextActive
                        : null,
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
