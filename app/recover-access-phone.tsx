import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AuthBrandHeader } from '@/src/components/brand/AuthBrandHeader';
import { ScreenContainer } from '@/src/components/screen-container';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { FormCard } from '@/src/components/ui/FormCard';
import { StepIndicator } from '@/src/components/ui/StepIndicator';
import { passwordResetSchema, type PasswordResetFormValues } from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { normalizePhoneNumber, sendPasswordResetSmsCode } from '@/src/services';
import { appTheme } from '@/src/theme/app-theme';

export default function RecoverAccessPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      console.log('RecoverAccessPhone screen mounted');
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { phoneNumber: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: PasswordResetFormValues) => {
    setIsSubmitting(true);

    try {
      const normalizedPhoneNumber = normalizePhoneNumber(values.phoneNumber);
      const result = await sendPasswordResetSmsCode({ phoneNumber: normalizedPhoneNumber });

      await notify(
        'Kod SMS wysłany',
        'Jeżeli konto istnieje, wysłaliśmy kod resetu hasła na podany numer telefonu.',
        'success'
      );
      router.push({
        pathname: '/reset-password',
        params: {
          phoneNumber: normalizedPhoneNumber,
          verificationId: result.verificationId,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się wysłać kodu resetu hasła.';
      await notify('Błąd resetu hasła', message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      softOverlay
      title="Nie pamiętam hasła"
      description="Odzyskaj dostęp do konta mieszkańca przez SMS.">
      <StepIndicator current={1} total={2} labels={['Numer telefonu', 'Nowe hasło']} />
      <AuthBrandHeader compact showLogo={false} description="Wyślemy kod SMS na numer powiązany z kontem." />
      <FormCard>
        <View style={styles.form}>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Numer telefonu"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="+48 500 600 700"
                keyboardType="phone-pad"
                autoCapitalize="none"
                error={errors.phoneNumber?.message}
                helperText="Reset hasła odbywa się przez SMS."
              />
            )}
          />

          <AppButton
            title="Wyślij kod SMS"
            loadingTitle="Wysyłanie..."
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
