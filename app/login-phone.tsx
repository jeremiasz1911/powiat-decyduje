import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingLoginLogo } from '@/src/components/auth/FloatingLoginLogo';
import { LoginAnimatedBackground, LoginSlashLines } from '@/src/components/auth/LoginAnimatedBackground';
import { AuthScreenOverlay } from '@/src/components/layout/auth-screen-overlay';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { FormCard } from '@/src/components/ui/FormCard';
import { residentLoginSchema, type ResidentLoginFormValues } from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { loginWithIdentifier } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

export default function LoginPhoneScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const { notify } = useAppFeedback();
  const { refreshResidentAccounts, setActiveResidentAccountId } = useAuthContext();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      console.log('LoginPhone screen mounted');
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResidentLoginFormValues>({
    resolver: zodResolver(residentLoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const finishLogin = async (identifier: string, password: string) => {
    await loginWithIdentifier({ identifier, password });
    const accounts = await refreshResidentAccounts();

    if (accounts.length > 1) {
      router.replace('/select-resident-account');
      return;
    }

    if (accounts[0]) {
      await setActiveResidentAccountId(accounts[0].id, accounts);
    }

    await notify('Zalogowano', 'Witamy w systemie Powiat Decyduje.', 'success');
    router.replace('/(drawer)/(tabs)');
  };

  const onSubmit = async (values: ResidentLoginFormValues) => {
    setIsSigningIn(true);

    try {
      await finishLogin(values.identifier, values.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zalogować.';
      await notify('Błąd logowania', message, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        Platform.OS === 'web' ? { height: windowHeight, maxHeight: windowHeight } : null,
      ]}>
      <LoginAnimatedBackground />
      <AuthScreenOverlay />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <View style={styles.page}>
            <View style={styles.logoSection}>
              <FloatingLoginLogo compact description="Zaloguj się do Powiat Decyduje." />
              <View style={styles.logoSlashBand} pointerEvents="none">
                <LoginSlashLines scope="screen" />
              </View>
            </View>

            <Animated.View entering={FadeInUp.delay(160).duration(560)} style={styles.formWrap}>
              <FormCard style={styles.formCard}>
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="identifier"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        label="Email lub numer telefonu"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="jan@example.com lub 500 600 700"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={errors.identifier?.message}
                        inputStyle={styles.input}
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
                        secureTextEntry
                        placeholder="Wpisz hasło"
                        autoCapitalize="none"
                        error={errors.password?.message}
                        inputStyle={styles.input}
                      />
                    )}
                  />

                  <AppButton
                    title="Zaloguj się"
                    loadingTitle="Logowanie..."
                    loading={isSigningIn}
                    disabled={isSigningIn}
                    onPress={handleSubmit(onSubmit)}
                    style={styles.primaryButton}
                  />

                  <AppButton
                    title="Zarejestruj konto"
                    variant="secondary"
                    onPress={() => router.push('/register-resident')}
                    style={styles.secondaryButton}
                  />

                  <Pressable onPress={() => router.push('/recover-access-phone')} style={styles.linkButton}>
                    <Text style={styles.linkText}>Nie pamiętasz hasła?</Text>
                  </Pressable>
                </View>
              </FormCard>
            </Animated.View>

            <Text style={styles.footerText}>
              Nie masz konta?{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/register-resident')}>
                Zarejestruj się
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.background,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.md,
    gap: appTheme.spacing.md,
    position: 'relative',
  },
  logoSection: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
    overflow: 'visible',
  },
  logoSlashBand: {
    ...StyleSheet.absoluteFillObject,
    top: -48,
    bottom: -48,
    left: -appTheme.spacing.lg,
    right: -appTheme.spacing.lg,
    zIndex: 2,
    overflow: 'visible',
    elevation: 2,
  },
  formWrap: {
    width: '100%',
    zIndex: 3,
  },
  formCard: {
    borderRadius: 16,
    paddingVertical: appTheme.spacing.lg,
    paddingHorizontal: appTheme.spacing.lg,
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    ...appShadows.soft,
  },
  form: {
    gap: appTheme.spacing.md,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.border,
  },
  primaryButton: {
    minHeight: 52,
    marginTop: appTheme.spacing.xs,
  },
  secondaryButton: {
    minHeight: 48,
    backgroundColor: appColors.surface,
  },
  linkButton: {
    alignSelf: 'center',
    paddingVertical: 2,
  },
  linkText: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  footerLink: {
    color: appColors.primary,
    fontWeight: '800',
  },
});
