import { Box, Button, ButtonText, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { z } from 'zod';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
    completeResidentRegistration,
    confirmResidentPhoneLoginCode,
    sendResidentPhoneVerificationCode,
} from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useAuthFlow } from '@/src/store/auth-flow-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

const smsCodeSchema = z.object({
  smsCode: z.string().trim().regex(/^\d{6}$/, 'Kod SMS musi mieć dokładnie 6 cyfr.'),
});

type SmsCodeFormValues = z.infer<typeof smsCodeSchema>;

export default function VerifyResidentPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { refreshResidentAccounts, setActiveResidentAccountId } = useAuthContext();
  const { consumeRegistration, consumePhoneLogin, pendingPhoneLogin } = useAuthFlow();
  const params = useLocalSearchParams<{
    mode?: string;
    phoneNumber?: string;
    verificationId?: string;
  }>();
  const [verificationId, setVerificationId] = useState(params.verificationId ?? '');
  const [isResending, setIsResending] = useState(false);
  const mode = useMemo(() => params.mode ?? 'login', [params.mode]);
  const phoneNumber = useMemo(() => params.phoneNumber ?? '', [params.phoneNumber]);
  const isRegisterMode = mode === 'register';
  const isPhoneLoginMode = mode === 'login' && Boolean(pendingPhoneLogin);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SmsCodeFormValues>({
    resolver: zodResolver(smsCodeSchema),
    defaultValues: { smsCode: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: SmsCodeFormValues) => {
    if (!verificationId || !phoneNumber) {
      await notify('Brak danych', 'Brakuje numeru telefonu lub identyfikatora weryfikacji.', 'error');
      return;
    }

    try {
      if (isRegisterMode) {
        const pendingRegistration = consumeRegistration();
        if (!pendingRegistration) {
          throw new Error('Nie znaleziono danych rejestracji. Wróć do formularza i rozpocznij ponownie.');
        }

        await completeResidentRegistration(pendingRegistration, verificationId, values.smsCode);
        await refreshResidentAccounts();
        await notify('Rejestracja zakończona', 'Konto mieszkańca zostało utworzone.', 'success');
        router.replace('/(drawer)/(tabs)/projects');
        return;
      }

      await confirmResidentPhoneLoginCode({
        verificationId,
        smsCode: values.smsCode,
        phoneNumber,
      });

      const accounts = await refreshResidentAccounts();
      
      // If this was a phone login with pre-selected account
      if (isPhoneLoginMode && pendingPhoneLogin?.selectedResidentAccountId) {
        const phoneLogin = consumePhoneLogin();
        if (phoneLogin?.selectedResidentAccountId) {
          await setActiveResidentAccountId(phoneLogin.selectedResidentAccountId);
          await notify('Zalogowano', 'Kod SMS został potwierdzony.', 'success');
          router.replace('/(drawer)/(tabs)/projects');
          return;
        }
      }

      // Standard flow
      if (accounts.length > 1) {
        await notify('Wybierz profil', 'Ten numer ma kilka profili mieszkańca.', 'info');
        router.replace('/select-resident-account');
        return;
      }

      if (accounts[0]) {
        await setActiveResidentAccountId(accounts[0].id);
      }

      await notify('Zalogowano', 'Kod SMS został potwierdzony.', 'success');
      router.replace('/(drawer)/(tabs)/projects');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się potwierdzić kodu SMS.';
      await notify('Błąd weryfikacji', message, 'error');
    }
  };

  const handleResendCode = async () => {
    if (!phoneNumber) {
      await notify('Brak numeru', 'Nie można ponowić wysyłki bez numeru telefonu.', 'error');
      return;
    }

    setIsResending(true);

    try {
      const verification = await sendResidentPhoneVerificationCode({ phoneNumber });
      setVerificationId(verification.verificationId);
      await notify('Kod wysłany ponownie', `Nowy kod wysłano na ${verification.normalizedPhoneNumber}.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się wysłać kodu ponownie.';
      await notify('Błąd wysyłki', message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScreenContainer title="Potwierdź kod SMS" description="Wpisz kod SMS wysłany na Twój numer telefonu.">
      <Box style={styles.card}>
        <VStack space="md">
          <Text style={styles.meta}>Numer telefonu: {phoneNumber || '-'}</Text>

          <Controller
            control={control}
            name="smsCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text style={styles.label}>Kod SMS</Text>
                <Input style={styles.input}>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                    style={styles.inputText}
                  />
                </Input>
                {errors.smsCode ? <Text style={styles.errorText}>{errors.smsCode.message}</Text> : null}
              </VStack>
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
            <ButtonText style={styles.primaryButtonText}>
              {isSubmitting ? 'Potwierdzanie...' : 'Potwierdź kod'}
            </ButtonText>
          </Button>

          <Button variant="outline" onPress={handleResendCode} isDisabled={isResending} style={styles.secondaryButton}>
            <ButtonText style={styles.secondaryButtonText}>
              {isResending ? 'Wysyłanie...' : 'Wyślij kod ponownie'}
            </ButtonText>
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
  meta: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 13,
  },
  label: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
  },
  inputText: {
    color: futuristicTheme.colors.textPrimary,
  },
  errorText: {
    color: futuristicTheme.colors.danger,
    fontSize: 12,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: futuristicTheme.colors.accent,
    ...futuristicShadows.glow,
  },
  primaryButtonText: {
    color: futuristicTheme.colors.textDark,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: 'rgba(13, 47, 79, 0.5)',
  },
  secondaryButtonText: {
    color: futuristicTheme.colors.textPrimary,
    fontWeight: '700',
  },
});
