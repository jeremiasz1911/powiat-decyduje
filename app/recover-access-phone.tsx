import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, ButtonText, Input, InputField, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import { passwordResetSchema, type PasswordResetFormValues } from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { sendResidentPasswordReset } from '@/src/services';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function RecoverAccessPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { identifier: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: PasswordResetFormValues) => {
    setIsSubmitting(true);

    try {
      await sendResidentPasswordReset({ identifier: values.identifier });
      await notify(
        'Wysłano instrukcję',
        'Jeżeli konto istnieje, wysłaliśmy bezpieczny link do resetu hasła na e-mail przypisany do konta.',
        'success'
      );
      router.replace('/login-phone');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się wysłać instrukcji resetu hasła.';
      await notify('Błąd resetu hasła', message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      title="Nie pamiętam hasła"
      description="Wpisz e-mail, numer telefonu albo PESEL, aby rozpocząć bezpieczny reset hasła.">
      <Box style={styles.card}>
        <VStack space="md">
          <Text style={styles.helper}>
            Dla e-maila użyjemy Firebase Auth. Dla PESEL lub telefonu spróbujemy odnaleźć konto i wysłać reset na
            przypisany adres e-mail.
          </Text>

          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text style={styles.label}>E-mail, telefon albo PESEL</Text>
                <Input style={styles.input}>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="np. jan@adres.pl albo +48 500 600 700"
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                    autoCapitalize="none"
                    style={styles.inputText}
                  />
                </Input>
                {errors.identifier ? <Text style={styles.errorText}>{errors.identifier.message}</Text> : null}
              </VStack>
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
            <ButtonText style={styles.primaryButtonText}>
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetu'}
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
  helper: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
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
