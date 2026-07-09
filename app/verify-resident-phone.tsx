import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthBrandHeader } from '@/src/components/brand/AuthBrandHeader';
import { ScreenContainer } from '@/src/components/screen-container';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { FormCard } from '@/src/components/ui/FormCard';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { completeResidentRegistration, sendResidentPhoneVerificationCode } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useAuthFlow } from '@/src/store/auth-flow-context';
import { appTheme, formStyles } from '@/src/theme/app-theme';

const smsCodeSchema = z.object({
  smsCode: z.string().trim().regex(/^\d{6}$/, 'Kod SMS musi mieć dokładnie 6 cyfr.'),
});

type SmsCodeFormValues = z.infer<typeof smsCodeSchema>;

export default function VerifyResidentPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { refreshResidentAccounts } = useAuthContext();
  const { consumeRegistration, pendingRegistration, updateRegistrationVerificationId } = useAuthFlow();
  const params = useLocalSearchParams<{
    mode?: string;
    phoneNumber?: string;
    verificationId?: string;
  }>();
  const [verificationId, setVerificationId] = useState(params.verificationId ?? '');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const mode = useMemo(() => params.mode ?? 'register', [params.mode]);
  const phoneNumber = useMemo(() => params.phoneNumber ?? '', [params.phoneNumber]);
  const isRegisterMode = mode === 'register';

  useEffect(() => {
    if (__DEV__) {
      console.log('VerifyResidentPhone screen mounted');
    }
  }, []);

  useEffect(() => {
    if (resendCooldownSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setResendCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldownSeconds]);

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
    if (!isRegisterMode) {
      await notify('Logowanie', 'Logowanie odbywa się przez e-mail i hasło.', 'info');
      router.replace('/login-phone');
      return;
    }

    if (!verificationId || !phoneNumber) {
      await notify('Brak danych', 'Brakuje numeru telefonu lub identyfikatora weryfikacji.', 'error');
      return;
    }

    if (!pendingRegistration) {
      await notify(
        'Brak danych rejestracji',
        'Nie znaleziono danych rejestracji. Wróć do formularza i rozpocznij ponownie.',
        'error'
      );
      router.replace('/register-resident');
      return;
    }

    try {
      const pending = consumeRegistration();
      if (!pending) {
        throw new Error('Nie znaleziono danych rejestracji. Wróć do formularza i rozpocznij ponownie.');
      }

      await completeResidentRegistration(pending, verificationId, values.smsCode);
      await refreshResidentAccounts(pending.pesel.trim());

      await notify('Rejestracja zakończona', 'Konto mieszkańca zostało utworzone.', 'success');
      router.replace('/(drawer)/(tabs)');
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

    if (resendCount >= 5) {
      await notify('Limit wysyłek', 'Możesz wysłać kod maksymalnie 5 razy. Spróbuj za kilka minut.', 'error');
      return;
    }

    if (resendCooldownSeconds > 0) {
      await notify('Czekaj', `Poczekaj ${resendCooldownSeconds} sekund przed ponowną wysyłką.`, 'info');
      return;
    }

    setIsResending(true);

    try {
      const verification = await sendResidentPhoneVerificationCode({ phoneNumber });
      setVerificationId(verification.verificationId);
      updateRegistrationVerificationId(verification.verificationId);
      setResendCount((prev) => prev + 1);
      setResendCooldownSeconds(30);
      await notify('Kod wysłany ponownie', `Nowy kod wysłano na ${verification.normalizedPhoneNumber}.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się wysłać kodu ponownie.';
      await notify('Błąd wysyłki', message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScreenContainer
      softOverlay
      title="Potwierdź kod SMS"
      description="Wpisz 6-cyfrowy kod wysłany na Twój numer telefonu.">
      <AuthBrandHeader compact showLogo={false} description="Ostatni krok rejestracji mieszkańca." />
      <FormCard>
        <View style={styles.form}>
          <Text style={formStyles.meta}>Numer telefonu: {phoneNumber || '—'}</Text>

          <Controller
            control={control}
            name="smsCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Kod SMS"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                smsCode
                error={errors.smsCode?.message}
                helperText="Kod jest ważny przez kilka minut."
              />
            )}
          />

          <AppButton
            title="Potwierdź"
            loadingTitle="Sprawdzanie..."
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />

          <AppButton
            title={
              isResending
                ? 'Wysyłanie...'
                : resendCooldownSeconds > 0
                  ? `Wyślij ponownie za ${resendCooldownSeconds}s`
                  : resendCount >= 5
                    ? 'Limit wysyłek'
                    : `Wyślij kod ponownie (${resendCount}/5)`
            }
            variant="ghost"
            disabled={isResending || resendCooldownSeconds > 0 || resendCount >= 5}
            onPress={handleResendCode}
          />
        </View>
      </FormCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: appTheme.spacing.lg,
  },
});
