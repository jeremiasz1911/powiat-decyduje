import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginBrandedHeader } from '@/src/components/auth/LoginBrandedHeader';
import { LoginScreenFooter } from '@/src/components/auth/LoginScreenFooter';
import { LoginAnimatedBackground } from '@/src/components/auth/LoginAnimatedBackground';
import { AuthScreenOverlay } from '@/src/components/layout/auth-screen-overlay';
import { BootstrapLoadingScreen } from '@/src/components/bootstrap-loading-screen';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { residentLoginSchema, type ResidentLoginFormValues } from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  getRememberMePreference,
  markPersistentLogin,
  markSessionOnlyLogin,
  setRememberMePreference,
} from '@/src/lib/remember-me';
import { loginWithIdentifier } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

export default function LoginPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { notify } = useAppFeedback();
  const { colors, colorScheme, shadows } = useAppTheme();
  const { refreshResidentAccounts, setActiveResidentAccountId, enterGuestMode, isAuthenticated, loading } =
    useAuthContext();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isEnteringGuestMode, setIsEnteringGuestMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [rememberMeReady, setRememberMeReady] = useState(false);

  useEffect(() => {
    void getRememberMePreference().then((value) => {
      setRememberMe(value);
      setRememberMeReady(true);
    });
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(drawer)/(tabs)');
    }
  }, [isAuthenticated, loading, router]);

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
    if (rememberMe) {
      markPersistentLogin();
    } else {
      markSessionOnlyLogin();
    }

    await setRememberMePreference(rememberMe);
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

  const handleContinueAsGuest = async () => {
    setIsEnteringGuestMode(true);

    try {
      await enterGuestMode();
      router.replace('/(drawer)/(tabs)/map');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się przejść w tryb gościa.';
      await notify('Błąd', message, 'error');
    } finally {
      setIsEnteringGuestMode(false);
    }
  };

  if (loading || !rememberMeReady) {
    return <BootstrapLoadingScreen label="Ładowanie logowania" />;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <View
      style={[
        styles.root,
        {
          width: windowWidth,
          height: windowHeight,
          backgroundColor: colors.background,
        },
      ]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <LoginAnimatedBackground />
      <AuthScreenOverlay />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.flex,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}>
        <View style={styles.page}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.header}>
              <LoginBrandedHeader />
            </View>

            <Animated.View entering={FadeInDown.delay(80).duration(480)} style={styles.form}>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextInput
                    variant="minimal"
                    label="Email lub telefon"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="jan@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    error={errors.identifier?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextInput
                    variant="minimal"
                    label="Hasło"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry
                    placeholder="••••••••"
                    autoCapitalize="none"
                    error={errors.password?.message}
                  />
                )}
              />

              <View style={styles.metaRow}>
                <Pressable
                  onPress={() => setRememberMe((current) => !current)}
                  style={styles.rememberRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  accessibilityLabel="Zapamiętaj mnie">
                  <Ionicons
                    name={rememberMe ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={rememberMe ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.rememberLabel, { color: colors.textSecondary }]}>Zapamiętaj mnie</Text>
                </Pressable>

                <Pressable onPress={() => router.push('/recover-access-phone')} hitSlop={8}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>Nie pamiętasz hasła?</Text>
                </Pressable>
              </View>

              <AppButton
                title="Zaloguj się"
                loadingTitle="Logowanie..."
                loading={isSigningIn}
                disabled={isSigningIn}
                onPress={handleSubmit(onSubmit)}
                style={[styles.primaryButton, { borderRadius: 12 }]}
              />

              <View style={styles.secondaryActions}>
                <Pressable onPress={() => router.push('/register-resident')} hitSlop={8}>
                  <Text style={[styles.secondaryLink, { color: colors.textSecondary }]}>
                    Nie masz konta?{' '}
                    <Text style={[styles.secondaryLinkStrong, { color: colors.primary }]}>Zarejestruj się</Text>
                  </Text>
                </Pressable>

                <View style={styles.guestDividerRow}>
                  <View style={[styles.guestDividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.guestDividerText, { color: colors.textMuted }]}>lub</Text>
                  <View style={[styles.guestDividerLine, { backgroundColor: colors.border }]} />
                </View>

                <AppButton
                  title="Kontynuuj jako gość"
                  loadingTitle="Ładowanie..."
                  loading={isEnteringGuestMode}
                  disabled={isSigningIn || isEnteringGuestMode}
                  variant="ghost"
                  onPress={() => void handleContinueAsGuest()}
                  style={[
                    styles.guestOutlineButton,
                    colorScheme === 'light' ? shadows.soft : null,
                    {
                      borderColor:
                        colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                      backgroundColor:
                        colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.42)',
                    },
                  ]}
                  textStyle={[styles.guestOutlineText, { color: colors.textPrimary }]}
                />
              </View>
            </Animated.View>
          </ScrollView>

          <LoginScreenFooter />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
    zIndex: 2,
  },
  page: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.xl,
    justifyContent: 'space-between',
  },
  scroll: {
    flex: 1,
    overflow: 'visible',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.lg,
    overflow: 'visible',
  },
  header: {
    alignItems: 'center',
    marginBottom: appTheme.spacing.xl,
    overflow: 'visible',
    zIndex: 5,
  },
  form: {
    gap: appTheme.spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.md,
    marginTop: -appTheme.spacing.xs,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.xs,
    flexShrink: 1,
  },
  rememberLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 52,
    marginTop: appTheme.spacing.sm,
  },
  secondaryActions: {
    alignItems: 'stretch',
    gap: appTheme.spacing.lg,
    marginTop: appTheme.spacing.md,
    width: '100%',
  },
  secondaryLink: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  secondaryLinkStrong: {
    fontWeight: '700',
  },
  guestDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    width: '100%',
  },
  guestDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  guestDividerText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  guestOutlineButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  guestOutlineText: {
    fontWeight: '700',
  },
});
