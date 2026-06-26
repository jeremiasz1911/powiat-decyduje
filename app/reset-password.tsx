import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AuthBrandHeader } from '@/src/components/brand/AuthBrandHeader';
import { ScreenContainer } from '@/src/components/screen-container';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { FormCard } from '@/src/components/ui/FormCard';
import { StepIndicator } from '@/src/components/ui/StepIndicator';
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { resetPasswordWithSmsCode } from '@/src/services';
import { appTheme, formStyles } from '@/src/theme/app-theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    verificationId?: string;
  }>();

  const phoneNumber = useMemo(() => params.phoneNumber ?? '', [params.phoneNumber]);
  const verificationId = useMemo(() => params.verificationId ?? '', [params.verificationId]);

  useEffect(() => {
    if (__DEV__) {
      console.log('ResetPassword screen mounted');
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmFormValues>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      smsCode: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!phoneNumber || !verificationId) {
      router.replace('/recover-access-phone');
    }
  }, [phoneNumber, router, verificationId]);

  const onSubmit = async (values: PasswordResetConfirmFormValues) => {
    if (!verificationId) {
      await notify('Brak danych', 'Brak identyfikatora weryfikacji. Wyślij kod SMS ponownie.', 'error');
      router.replace('/recover-access-phone');
      return;
    }

    try {
      await resetPasswordWithSmsCode({
        verificationId,
        smsCode: values.smsCode,
        newPassword: values.newPassword,
      });

      await notify('Hasło zmienione', 'Hasło zostało zmienione. Możesz się zalogować.', 'success');
      router.replace('/login-phone');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zmienić hasła.';
      await notify('Błąd resetu hasła', message, 'error');
    }
  };

  return (
    <ScreenContainer
      softOverlay
      title="Ustaw nowe hasło"
      description="Wpisz kod SMS i wybierz nowe hasło do konta.">
      <StepIndicator current={2} total={2} labels={['Numer telefonu', 'Nowe hasło']} />
      <AuthBrandHeader compact showLogo={false} description="Ostatni krok odzyskiwania dostępu." />
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
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Nowe hasło"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                placeholder="Minimum 8 znaków"
                autoCapitalize="none"
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Powtórz nowe hasło"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry
                placeholder="Powtórz nowe hasło"
                autoCapitalize="none"
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <AppButton
            title="Zmień hasło"
            loadingTitle="Zmienianie hasła..."
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
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
