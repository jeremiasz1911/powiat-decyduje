import {
    Box,
    Button,
    ButtonText,
    Checkbox,
    CheckboxIcon,
    CheckboxIndicator,
    CheckboxLabel,
    CheckIcon,
    Heading,
    Input,
    InputField,
    Text,
    VStack,
} from '@gluestack-ui/themed';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import {
    residentProfileSchema,
    type ResidentProfileFormValues,
} from '@/src/features/profile/resident-profile.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
    ensureAnonymousAuth,
    getResidentAccountProfile,
    upsertResidentAccountProfile,
} from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';
import { AppScreen } from '@/src/components/layout/app-screen';

export default function DrawerProfileScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { activeResidentAccount, refreshResidentAccounts, logout } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const defaultValues = useMemo<ResidentProfileFormValues>(
    () => ({
      fullName: '',
      email: '',
      phone: '',
      village: 'Mlawa',
      street: '',
      acceptedRegulations: false,
    }),
    []
  );

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResidentProfileFormValues>({
    resolver: zodResolver(residentProfileSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await ensureAnonymousAuth();
      setUid(user.uid);
      if (!activeResidentAccount) {
        throw new Error('Wybierz aktywne konto mieszkanca, aby edytowac profil.');
      }
      const profile = await getResidentAccountProfile(user.uid, activeResidentAccount.id);

      if (!profile) {
        setProfileExists(false);
        reset(defaultValues);
        return;
      }

      setProfileExists(true);
      reset({
        fullName: profile.fullName,
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        village: profile.village || 'Mlawa',
        street: profile.street ?? '',
        acceptedRegulations: true,
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac profilu.';
      setError(message);
      await notify('Blad profilu', message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeResidentAccount, defaultValues, notify, reset]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onSubmit = async (values: ResidentProfileFormValues) => {
    if (!uid) {
      await notify('Brak sesji', 'Nie mozna zapisac profilu bez aktywnego uzytkownika.', 'error');
      return;
    }

    if (!activeResidentAccount) {
      await notify('Brak profilu', 'Wybierz konto mieszkanca przed zapisem profilu.', 'error');
      return;
    }

    try {
      await upsertResidentAccountProfile({
        uid,
        residentAccountId: activeResidentAccount.id,
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        village: values.village,
        street: values.street || undefined,
      });
      await refreshResidentAccounts();

      setProfileExists(true);
      await notify(
        profileExists ? 'Profil zaktualizowany' : 'Rejestracja zakonczona',
        'Konto mieszkanca gminy Mlawa jest gotowe.',
        'success'
      );
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Nie udalo sie zapisac profilu.';
      setError(message);
      await notify('Blad zapisu', message, 'error');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      await notify('Wylogowano', 'Wylogowano z konta mieszkanca.', 'success');
      router.replace('/login-phone');
    } catch (logoutError) {
      const message = logoutError instanceof Error ? logoutError.message : 'Nie udalo sie wylogowac.';
      await notify('Blad wylogowania', message, 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return <LoadingState label="Laduje profil mieszkanca..." />;
  }

  if (error) {
    return (
      <Box flex={1} bg={futuristicTheme.colors.bgTop} p="$4" justifyContent="center">
        <ErrorState message={error} actionLabel="Sprobuj ponownie" onActionPress={() => void loadProfile()} />
      </Box>
    );
  }

  return (
    <AppScreen gradientColors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]}>
      <Box flex={1}>
        <ScrollView contentContainerStyle={styles.content}>
          <VStack space="lg">
            <Heading size="lg" color={futuristicTheme.colors.textPrimary}>Profil mieszkanca</Heading>
            <Text color={futuristicTheme.colors.textMuted}>
            Zarejestruj sie jako mieszkaniec gminy Mlawa. Po zapisie otrzymasz karte profilu.
            </Text>

            <Box style={styles.profileCard}>
              <VStack space="xs">
                <Text style={styles.cardTitle}>Karta profilu</Text>
                <Text color={futuristicTheme.colors.textMuted}>Konto: {activeResidentAccount?.label ?? '-'}</Text>
                <Text color={futuristicTheme.colors.textMuted}>PESEL: {activeResidentAccount?.pesel ?? '-'}</Text>
                <Text color={futuristicTheme.colors.textMuted}>Gmina: Mlawa</Text>
                <Text color={futuristicTheme.colors.textMuted}>Status: {profileExists ? 'Mieszkaniec zarejestrowany' : 'Nieuzupelniony'}</Text>
                <Text color={futuristicTheme.colors.textMuted}>UID: {uid ?? '-'}</Text>
              </VStack>
            </Box>

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Imie i nazwisko</Text>
                <Input style={styles.input}>
                  <InputField
                    placeholder="Np. Jan Kowalski"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.fullName ? <Text color="$error600">{errors.fullName.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Email (opcjonalnie)</Text>
                <Input style={styles.input}>
                  <InputField
                    placeholder="jan@example.com"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.email ? <Text color="$error600">{errors.email.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Telefon (opcjonalnie)</Text>
                <Input style={styles.input}>
                  <InputField
                    placeholder="Np. 600700800"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.phone ? <Text color="$error600">{errors.phone.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="village"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Miejscowosc</Text>
                <Input style={styles.input}>
                  <InputField placeholder="Mlawa" value={value} onBlur={onBlur} onChangeText={onChange} color={futuristicTheme.colors.textPrimary} placeholderTextColor={futuristicTheme.colors.textMuted} />
                </Input>
                {errors.village ? <Text color="$error600">{errors.village.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="street"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Ulica i nr (opcjonalnie)</Text>
                <Input style={styles.input}>
                  <InputField placeholder="Np. Sienkiewicza 12" value={value} onBlur={onBlur} onChangeText={onChange} color={futuristicTheme.colors.textPrimary} placeholderTextColor={futuristicTheme.colors.textMuted} />
                </Input>
                {errors.street ? <Text color="$error600">{errors.street.message}</Text> : null}
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
                  <CheckboxLabel color={futuristicTheme.colors.textPrimary}>Oswiadczam, ze jestem mieszkancem gminy Mlawa.</CheckboxLabel>
                </Checkbox>
                {errors.acceptedRegulations ? (
                  <Text color="$error600">{errors.acceptedRegulations.message}</Text>
                ) : null}
              </VStack>
            )}
          />

            <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
              <ButtonText color={futuristicTheme.colors.textDark}>{isSubmitting ? 'Zapisywanie...' : profileExists ? 'Aktualizuj profil' : 'Zarejestruj profil'}</ButtonText>
            </Button>

            <Button
              onPress={handleLogout}
              isDisabled={isLoggingOut}
              style={styles.dangerButton}
              action="negative">
              <ButtonText color={futuristicTheme.colors.textPrimary}>
                {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
              </ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </Box>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 14,
  },
  profileCard: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 18,
    padding: 14,
    ...futuristicShadows.soft,
  },
  cardTitle: {
    fontWeight: '700',
    color: futuristicTheme.colors.accent,
  },
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 14,
    ...futuristicShadows.glow,
  },
  dangerButton: {
    borderColor: futuristicTheme.colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderRadius: 14,
  },
});
