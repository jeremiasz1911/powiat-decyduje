import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
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
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResidentRegistrationFormValues>({
    resolver: zodResolver(residentRegistrationSchema),
    defaultValues: {
      phoneNumber: '',
      pesel: '',
      acceptedRegulations: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ResidentRegistrationFormValues) => {
    const availability = await checkResidentRegistrationAvailability({
      phoneNumber: values.phoneNumber,
      pesel: values.pesel,
    });

    if (availability.phoneLimitReached) {
      await notify(
        'Limit kont na numerze',
        'Na ten numer telefonu utworzono juz maksymalna liczbe kont',
        'error'
      );
      return;
    }

    if (availability.phoneTaken) {
      await notify(
        'Numer zajety',
        'Ten numer telefonu jest juz przypisany do innego konta. Zaloguj numerem telefonu.',
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
            Uzyj numeru telefonu i numeru PESEL, aby utworzyc konto mieszkanca i potwierdzic je kodem SMS.
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
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    placeholder="+48 500 600 700"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.phoneNumber ? <Text color="$error600">{errors.phoneNumber.message}</Text> : null}
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
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    maxLength={11}
                    autoComplete="off"
                    placeholder="00000000000"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.pesel ? <Text color="$error600">{errors.pesel.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="acceptedRegulations"
            render={({ field: { onChange, value } }) => (
              <VStack space="xs">
                <Checkbox value="accepted" isChecked={Boolean(value)} onChange={onChange}>
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel color={futuristicTheme.colors.textPrimary}>Akceptuje regulamin</CheckboxLabel>
                </Checkbox>
                {errors.acceptedRegulations ? (
                  <Text color="$error600">{errors.acceptedRegulations.message}</Text>
                ) : null}
              </VStack>
            )}
          />

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
  },
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 12,
    ...futuristicShadows.glow,
  },
});
