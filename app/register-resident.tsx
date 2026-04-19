import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Input,
  InputField,
  Text,
  VStack,
} from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import {
  residentRegistrationSchema,
  type ResidentRegistrationFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  checkResidentRegistrationAvailability,
  sendResidentPhoneVerificationCode,
} from '@/src/services';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function RegisterResidentScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [limitError, setLimitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResidentRegistrationFormValues>({
    resolver: zodResolver(residentRegistrationSchema),
    defaultValues: {
      phoneNumber: '',
      pesel: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ResidentRegistrationFormValues) => {
    setLimitError(null);

    const availability = await checkResidentRegistrationAvailability({
      phoneNumber: values.phoneNumber,
      pesel: values.pesel,
    });

    if (availability.phoneLimitReached) {
      const message =
        'Na ten numer telefonu zostało już utworzonych 5 kont mieszkańców. Nie można dodać kolejnego konta.';
      setLimitError(message);
      await notify(
        'Limit kont na numerze',
        message,
        'error'
      );
      return;
    }

    if (availability.peselTaken) {
      await notify(
        'PESEL zajety',
        'To konto mieszkanca zostalo juz zarejestrowane',
        'error'
      );
      return;
    }

    const verification = await sendResidentPhoneVerificationCode({
      phoneNumber: values.phoneNumber,
    });

    await notify('Kod wyslany', `Wyslalismy SMS na numer ${verification.normalizedPhoneNumber}.`, 'success');

    router.push({
      pathname: '/verify-resident-phone',
      params: {
        mode: 'register',
        phoneNumber: verification.normalizedPhoneNumber,
        verificationId: verification.verificationId,
        pesel: values.pesel,
      },
    });
  };

  return (
    <ScreenContainer title="Rejestracja mieszkanca" description="Uzupelnij dane, aby kontynuowac.">
      <Box style={styles.formCard}>
        <VStack space="md">
          <Text color={futuristicTheme.colors.textMuted}>
            1. Wpisz numer telefonu
            {'\n'}
            2. Wpisz numer PESEL
            {'\n'}
            3. Sprawdzimy dane i wyslemy kod SMS
          </Text>

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Numer telefonu</Text>
                <Input style={styles.input}>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(nextValue) => {
                      if (limitError) {
                        setLimitError(null);
                      }
                      onChange(nextValue);
                    }}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    placeholder="+48 500 600 700"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="pesel"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>PESEL</Text>
                <Input style={styles.input}>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(nextValue) => {
                      if (limitError) {
                        setLimitError(null);
                      }
                      onChange(nextValue);
                    }}
                    keyboardType="number-pad"
                    maxLength={11}
                    autoComplete="off"
                    placeholder="00000000000"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.pesel ? <Text style={styles.errorText}>{errors.pesel.message}</Text> : null}
              </VStack>
            )}
          />

          {limitError ? (
            <Box style={styles.limitAlert}>
              <Text style={styles.limitAlertText}>{limitError}</Text>
            </Box>
          ) : null}

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
            <ButtonText color={futuristicTheme.colors.textDark}>{isSubmitting ? 'Zapisywanie...' : 'Kontynuuj'}</ButtonText>
          </Button>
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
  input: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 62,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 12,
    ...futuristicShadows.glow,
  },
  errorText: {
    color: futuristicTheme.colors.danger,
    fontSize: 16,
    lineHeight: 22,
  },
  limitAlert: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  limitAlertText: {
    color: futuristicTheme.colors.danger,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});
