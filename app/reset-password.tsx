import { Box, Button, ButtonText, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import {
  passwordResetConfirmSchema,
  type PasswordResetConfirmFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { resetPasswordWithSmsCode } from '@/src/services';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    verificationId?: string;
  }>();

  const phoneNumber = useMemo(() => params.phoneNumber ?? '', [params.phoneNumber]);
  const verificationId = useMemo(() => params.verificationId ?? '', [params.verificationId]);

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
      title="Reset hasła"
      description="Wpisz kod SMS i ustaw nowe hasło do konta mieszkańca.">
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

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text style={styles.label}>Nowe hasło</Text>
                <Input style={styles.input}>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry
                    placeholder="Wpisz nowe hasło"
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                    autoCapitalize="none"
                    style={styles.inputText}
                  />
                </Input>
                {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text style={styles.label}>Powtórz nowe hasło</Text>
                <Input style={styles.input}>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry
                    placeholder="Powtórz nowe hasło"
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                    autoCapitalize="none"
                    style={styles.inputText}
                  />
                </Input>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                ) : null}
              </VStack>
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
            <ButtonText style={styles.primaryButtonText}>
              {isSubmitting ? 'Zmienianie hasła...' : 'Zmień hasło'}
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
});
