import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

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

export default function RegisterResidentScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { beginRegistration } = useAuthFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResidentRegistrationFormValues>({
    resolver: zodResolver(residentRegistrationSchema),
    defaultValues,
    mode: 'onBlur',
  });

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
    <LinearGradient
      colors={[futuristicTheme.colors.bgTop, '#08203a', futuristicTheme.colors.bgBottom]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>PD</Text>
            </View>
            <Text style={styles.title}>Rejestracja mieszkańca</Text>
            <Text style={styles.subtitle}>Utwórz konto, potwierdź telefon i zapisz dane mieszkańca.</Text>
          </View>

          <Box style={styles.card}>
            <VStack space="lg">
              <Text style={styles.intro}>
                Wypełnij dane mieszkańca powiatu mławskiego. Kod SMS otrzymasz po zapisaniu formularza.
              </Text>

              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Numer telefonu</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="+48 500 600 700"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        keyboardType="phone-pad"
                        style={styles.inputText}
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
                    <Text style={styles.label}>PESEL</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="00000000000"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        keyboardType="number-pad"
                        maxLength={11}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.pesel ? <Text style={styles.errorText}>{errors.pesel.message}</Text> : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>E-mail</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="twoj@email.pl"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Hasło</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Minimum 8 znaków"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        secureTextEntry
                        autoCapitalize="none"
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Imię</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Jan"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.firstName ? <Text style={styles.errorText}>{errors.firstName.message}</Text> : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Nazwisko</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Kowalski"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.lastName ? <Text style={styles.errorText}>{errors.lastName.message}</Text> : null}
                  </VStack>
                )}
              />

              <Text style={styles.sectionTitle}>Adres</Text>

              <Controller
                control={control}
                name="address.street"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Ulica</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Sienkiewicza"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.address?.street ? <Text style={styles.errorText}>{errors.address.street.message}</Text> : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="address.houseNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Numer domu / lokalu</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="12 / 4"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.address?.houseNumber ? (
                      <Text style={styles.errorText}>{errors.address.houseNumber.message}</Text>
                    ) : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="address.apartmentNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Numer lokalu (opcjonalnie)</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value ?? ''}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="4"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="address.postalCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Kod pocztowy</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="06-500"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.address?.postalCode ? (
                      <Text style={styles.errorText}>{errors.address.postalCode.message}</Text>
                    ) : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="address.city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Miejscowość</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Mława"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.address?.city ? <Text style={styles.errorText}>{errors.address.city.message}</Text> : null}
                  </VStack>
                )}
              />

              <Controller
                control={control}
                name="address.commune"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Gmina</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Mława"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.address?.commune ? (
                      <Text style={styles.errorText}>{errors.address.commune.message}</Text>
                    ) : null}
                  </VStack>
                )}
              />

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
                    <Checkbox value="personalDataProcessingAccepted" isChecked={Boolean(value)} onChange={onChange}>
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

              <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
                <ButtonText style={styles.primaryButtonText}>
                  {isSubmitting ? 'Wysyłanie kodu SMS...' : 'Wyślij kod SMS'}
                </ButtonText>
              </Button>
            </VStack>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...futuristicShadows.glow,
  },
  logoText: {
    color: futuristicTheme.colors.accent,
    fontSize: 36,
    fontWeight: '900',
  },
  title: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 20,
    padding: 16,
    ...futuristicShadows.soft,
  },
  intro: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: futuristicTheme.colors.accent,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
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
  checkboxLabel: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: futuristicTheme.colors.accent,
    ...futuristicShadows.glow,
  },
  primaryButtonText: {
    color: futuristicTheme.colors.textDark,
    fontWeight: '800',
  },
});
