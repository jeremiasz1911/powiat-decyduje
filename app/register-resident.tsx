import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  VStack,
} from '@gluestack-ui/themed';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';

import { AuthBrandHeader } from '@/src/components/brand/AuthBrandHeader';
import { AppScreen } from '@/src/components/layout/app-screen';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { FormCard } from '@/src/components/ui/FormCard';
import { PeselInput } from '@/src/components/ui/PeselInput';
import { isDevSmsBypassEnabled } from '@/src/config/env';
import {
  residentRegistrationSchema,
  type ResidentRegistrationFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  checkResidentRegistrationAvailability,
  sendResidentPhoneVerificationCode,
} from '@/src/services';
import { useAuthFlow } from '@/src/store/auth-flow-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme, formStyles } from '@/src/theme/app-theme';

const defaultValues: ResidentRegistrationFormValues = {
  phoneNumber: '',
  pesel: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  address: {
    street: '',
    houseNumber: '',
    apartmentNumber: '',
    postalCode: '',
    city: '',
    commune: 'Mława',
  },
  residentDeclaration: false,
  termsAccepted: false,
  privacyPolicyAccepted: false,
  personalDataProcessingAccepted: false,
};

const testResidentValues: ResidentRegistrationFormValues = {
  phoneNumber: '+48500400300',
  pesel: '90011512346',
  email: 'test.mieszkanca@example.com',
  password: 'Test1234!',
  firstName: 'Jan',
  lastName: 'Kowalski',
  address: {
    street: 'Sienkiewicza',
    houseNumber: '12',
    apartmentNumber: '4',
    postalCode: '06-500',
    city: 'Mlawa',
    commune: 'Mlawa',
  },
  residentDeclaration: true,
  termsAccepted: true,
  privacyPolicyAccepted: true,
  personalDataProcessingAccepted: true,
};

const FIELD_ORDER: (keyof ResidentRegistrationFormValues | 'address')[] = [
  'phoneNumber',
  'pesel',
  'email',
  'password',
  'firstName',
  'lastName',
  'address',
  'residentDeclaration',
  'termsAccepted',
  'privacyPolicyAccepted',
  'personalDataProcessingAccepted',
];

function getFirstFormErrorMessage(
  formErrors: FieldErrors<ResidentRegistrationFormValues>
): string | undefined {
  for (const field of FIELD_ORDER) {
    if (field === 'address') {
      const addressErrors = formErrors.address;
      if (!addressErrors || typeof addressErrors !== 'object') {
        continue;
      }
      const nested = Object.values(addressErrors).find(
        (item) => item && typeof item === 'object' && 'message' in item && typeof item.message === 'string'
      );
      if (nested && typeof nested.message === 'string') {
        return nested.message;
      }
      continue;
    }

    const error = formErrors[field];
    if (error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return undefined;
}

export default function RegisterResidentScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { beginRegistration } = useAuthFlow();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      console.log('RegisterResident screen mounted');
    }
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResidentRegistrationFormValues>({
    resolver: zodResolver(residentRegistrationSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const fillTestRegistration = () => {
    reset(testResidentValues);
  };

  const testSmsOnly = async () => {
    try {
      const phone = testResidentValues.phoneNumber;
      await notify('SMS Test', `Wysyłam SMS na ${phone}...`, 'info');

      const verification = await sendResidentPhoneVerificationCode({
        phoneNumber: phone,
      });

      await notify(
        'SMS Wysłany',
        `Kod SMS wysłany na ${verification.normalizedPhoneNumber}. Sprawdź konsole dev dla kodu.`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SMS test failed';
      await notify('SMS Test Error', message, 'error');
    }
  };

  const onInvalid = (formErrors: FieldErrors<ResidentRegistrationFormValues>) => {
    const message = getFirstFormErrorMessage(formErrors);
    if (message) {
      void notify('Uzupełnij formularz', message, 'error');
    }
  };

  const onSubmit = async (values: ResidentRegistrationFormValues) => {
    setIsSubmitting(true);

    try {
      const availability = await checkResidentRegistrationAvailability({
        phoneNumber: values.phoneNumber,
        pesel: values.pesel,
      });

      if (availability.phoneLimitReached) {
        throw new Error('Na ten numer telefonu można mieć maksymalnie 5 kont mieszkańców.');
      }

      if (availability.peselTaken) {
        throw new Error('Ten numer PESEL jest już zarejestrowany w systemie.');
      }

      const verification = await sendResidentPhoneVerificationCode({
        phoneNumber: values.phoneNumber,
      });

      beginRegistration(values, verification.verificationId);
      await notify('Kod SMS wysłany', `Wysłaliśmy kod na ${verification.normalizedPhoneNumber}.`, 'success');
      router.push({
        pathname: '/verify-resident-phone',
        params: {
          mode: 'register',
          phoneNumber: verification.normalizedPhoneNumber,
          verificationId: verification.verificationId,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się rozpocząć rejestracji.';
      await notify('Błąd rejestracji', message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen cherryBackground softOverlay scroll keyboardAvoiding contentContainerStyle={styles.content}>
      <AuthBrandHeader
        compact
        description="Rejestracja mieszkańca i potwierdzenie numeru telefonu."
      />

      <FormCard>
        <View style={styles.form}>
          <RNText style={[formStyles.helper, styles.intro]}>
            Wypełnij dane mieszkańca powiatu mławskiego. Po zapisaniu formularza wyślemy kod SMS na podany numer.
          </RNText>

          <RNText style={styles.sectionTitle}>Dane logowania</RNText>

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
                error={errors.phoneNumber?.message}
                helperText="Na ten numer wyślemy kod weryfikacyjny."
              />
            )}
          />

          <Controller
            control={control}
            name="pesel"
            render={({ field: { onChange, onBlur, value } }) => (
              <PeselInput
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                error={errors.pesel?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="E-mail"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="twoj@email.pl"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Hasło"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Minimum 8 znaków"
                secureTextEntry
                autoCapitalize="none"
                error={errors.password?.message}
                helperText="Użyj co najmniej 8 znaków."
              />
            )}
          />

          <RNText style={styles.sectionTitle}>Dane osobowe</RNText>

          <View style={styles.nameRow}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  label="Imię"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Jan"
                  containerStyle={styles.nameField}
                  error={errors.firstName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  label="Nazwisko"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Kowalski"
                  containerStyle={styles.nameField}
                  error={errors.lastName?.message}
                />
              )}
            />
          </View>

          <RNText style={styles.sectionTitle}>Adres zamieszkania</RNText>

          <Controller
            control={control}
            name="address.street"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Ulica"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Sienkiewicza"
                error={errors.address?.street?.message}
              />
            )}
          />

          <View style={styles.nameRow}>
            <Controller
              control={control}
              name="address.houseNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  label="Nr domu"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="12"
                  containerStyle={styles.nameField}
                  error={errors.address?.houseNumber?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address.apartmentNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  label="Nr lokalu"
                  value={value ?? ''}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="4"
                  containerStyle={styles.nameField}
                  helperText="Opcjonalnie"
                />
              )}
            />
          </View>

          <View style={styles.nameRow}>
            <Controller
              control={control}
              name="address.postalCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  label="Kod pocztowy"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="06-500"
                  containerStyle={styles.nameField}
                  error={errors.address?.postalCode?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address.city"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  label="Miejscowość"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Mława"
                  containerStyle={styles.nameField}
                  error={errors.address?.city?.message}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="address.commune"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Gmina"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Mława"
                error={errors.address?.commune?.message}
              />
            )}
          />

          <RNText style={styles.sectionTitle}>Zgody</RNText>

          <VStack space="sm">
            <Controller
              control={control}
              name="residentDeclaration"
              render={({ field: { onChange, value } }) => (
                <Checkbox value="residentDeclaration" isChecked={Boolean(value)} onChange={onChange}>
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel style={styles.checkboxLabel}>
                    Oświadczam, że jestem mieszkańcem powiatu mławskiego
                  </CheckboxLabel>
                </Checkbox>
              )}
            />

            <Controller
              control={control}
              name="termsAccepted"
              render={({ field: { onChange, value } }) => (
                <Checkbox value="termsAccepted" isChecked={Boolean(value)} onChange={onChange}>
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel style={styles.checkboxLabel}>Akceptuję regulamin</CheckboxLabel>
                </Checkbox>
              )}
            />

            <Controller
              control={control}
              name="privacyPolicyAccepted"
              render={({ field: { onChange, value } }) => (
                <Checkbox value="privacyPolicyAccepted" isChecked={Boolean(value)} onChange={onChange}>
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel style={styles.checkboxLabel}>Akceptuję politykę prywatności</CheckboxLabel>
                </Checkbox>
              )}
            />

            <Controller
              control={control}
              name="personalDataProcessingAccepted"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  value="personalDataProcessingAccepted"
                  isChecked={Boolean(value)}
                  onChange={onChange}>
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel style={styles.checkboxLabel}>
                    Zgadzam się na przetwarzanie danych osobowych
                  </CheckboxLabel>
                </Checkbox>
              )}
            />
          </VStack>

          {errors.residentDeclaration?.message ||
          errors.termsAccepted?.message ||
          errors.privacyPolicyAccepted?.message ||
          errors.personalDataProcessingAccepted?.message ? (
            <RNText style={styles.consentError}>
              {errors.residentDeclaration?.message ??
                errors.termsAccepted?.message ??
                errors.privacyPolicyAccepted?.message ??
                errors.personalDataProcessingAccepted?.message}
            </RNText>
          ) : null}

          {isDevSmsBypassEnabled ? (
            <>
              <AppButton
                title="Uzupełnij rejestrację mieszkańca"
                variant="secondary"
                onPress={fillTestRegistration}
              />
              <AppButton
                title="Test SMS +48500400300"
                variant="ghost"
                onPress={() => {
                  void testSmsOnly();
                }}
              />
            </>
          ) : null}

          <AppButton
            title="Zarejestruj konto"
            loadingTitle="Sprawdzanie danych..."
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit, onInvalid)}
          />

          <Pressable onPress={() => router.replace('/login-phone')} style={styles.loginLink}>
            <RNText style={styles.loginLinkText}>Masz już konto? Zaloguj się</RNText>
          </Pressable>
        </View>
      </FormCard>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: appTheme.spacing.lg,
      paddingTop: appTheme.spacing.md,
      paddingBottom: appTheme.spacing.xxl,
      gap: appTheme.spacing.lg,
    },
    form: {
      gap: appTheme.spacing.lg,
    },
    intro: {
      marginBottom: appTheme.spacing.xs,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: appTheme.spacing.xs,
    },
    nameRow: {
      flexDirection: 'row',
      gap: appTheme.spacing.sm,
    },
    nameField: {
      flex: 1,
    },
    checkboxLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 20,
    },
    consentError: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
      marginTop: -4,
    },
    loginLink: {
      alignItems: 'center',
      paddingVertical: appTheme.spacing.sm,
    },
    loginLinkText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
