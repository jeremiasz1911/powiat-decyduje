import {
    Box,
    Button,
    ButtonText,
    Input,
    InputField,
    Text,
    VStack,
} from '@gluestack-ui/themed';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { residentLoginSchema, type ResidentLoginFormValues } from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  loginWithEmailPassword,
  resolveResidentLoginTarget,
  sendResidentPhoneVerificationCode,
  getResidentAccountsByPhoneNumber,
} from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useAuthFlow } from '@/src/store/auth-flow-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function LoginPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { refreshResidentAccounts, setActiveResidentAccountId } = useAuthContext();
  const { beginPasswordLogin, beginPhoneLogin } = useAuthFlow();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResidentLoginFormValues>({
    resolver: zodResolver(residentLoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const identifierValue = watch('identifier');

  const logoScale = useSharedValue(0.88);
  const glow = useSharedValue(0.45);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 160 });
    glow.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }), -1, true);
  }, [glow, logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.94 + glow.value * 0.08 }],
  }));

  const finishLogin = async (email: string, password: string, selectedResidentAccountId?: string) => {
    await loginWithEmailPassword({ email, password });
    const accounts = await refreshResidentAccounts();
    const nextActive = selectedResidentAccountId ?? accounts[0]?.id ?? null;

    if (nextActive) {
      await setActiveResidentAccountId(nextActive);
    }

    await notify('Zalogowano', 'Witamy w systemie Powiat Decyduje.', 'success');
    router.replace('/(drawer)/(tabs)/projects');
  };

  const onSubmit = async (values: ResidentLoginFormValues) => {
    setIsSigningIn(true);

    try {
      const resolution = await resolveResidentLoginTarget(values.identifier);

      if (resolution.requiresSelection) {
        beginPasswordLogin({
          identifier: values.identifier,
          password: values.password,
          email: resolution.email,
          residentAccounts: resolution.residentAccounts,
        });
        router.push('/select-resident-account');
        return;
      }

      await finishLogin(resolution.email, values.password, resolution.matchedResidentAccount?.id ?? undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zalogować.';
      await notify('Błąd logowania', message, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const onSmsLogin = async () => {
    const identifier = identifierValue.trim();
    if (!/^(?:\+48)?\d{9}$/.test(identifier.replace(/[\s-]/g, ''))) {
      await notify('Błędny numer', 'Do logowania SMS wpisz numer telefonu.', 'error');
      return;
    }

    setIsSendingSms(true);

    try {
      const accounts = await getResidentAccountsByPhoneNumber(identifier);

      if (accounts.length === 0) {
        await notify('Brak konta', 'Ten numer telefonu nie jest zarejestrowany.', 'error');
        return;
      }

      if (accounts.length === 1) {
        // If only one account, go directly to SMS verification
        beginPhoneLogin({
          phoneNumber: identifier,
          verificationId: '',
          residentAccounts: accounts,
        });

        try {
          const verification = await sendResidentPhoneVerificationCode({ phoneNumber: identifier });
          router.push({
            pathname: '/verify-resident-phone',
            params: {
              mode: 'login',
              phoneNumber: verification.normalizedPhoneNumber,
              verificationId: verification.verificationId,
            },
          });
        } catch (smsError) {
          const smsMessage = smsError instanceof Error ? smsError.message : 'Nie udało się wysłać kodu SMS.';
          await notify('Błąd SMS', smsMessage, 'error');
        }
      } else {
        // If multiple accounts, show selection screen first
        beginPhoneLogin({
          phoneNumber: identifier,
          verificationId: '',
          residentAccounts: accounts,
        });
        router.push('/pre-select-resident-account');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się sprawdzić dostępnych kont.';
      await notify('Błąd', message, 'error');
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <LinearGradient
      colors={[futuristicTheme.colors.bgTop, '#061b33', futuristicTheme.colors.bgBottom]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}>
      <View style={styles.safeArea}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.content}>
          <Animated.View style={[styles.glow, glowStyle]} />

          <Animated.View entering={FadeInDown.duration(700).springify()} style={[styles.logo, logoStyle]}>
            <Text style={styles.logoText}>PD</Text>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(120).duration(650)} style={styles.title}>
            Powiat Decyduje
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(240).duration(650)} style={styles.subtitle}>
            Logowanie, rejestracja i SMS w jednym futurystycznym flow.
          </Animated.Text>

          <Box style={styles.card}>
            <VStack space="md">
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <VStack space="xs">
                    <Text style={styles.label}>Numer telefonu albo PESEL</Text>
                    <Input style={styles.input}>
                      <InputField
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="+48 500 600 700 lub PESEL"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        keyboardType="default"
                        autoCapitalize="none"
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.identifier ? <Text style={styles.errorText}>{errors.identifier.message}</Text> : null}
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
                        secureTextEntry
                        placeholder="Wpisz hasło"
                        placeholderTextColor={futuristicTheme.colors.textMuted}
                        autoCapitalize="none"
                        style={styles.inputText}
                      />
                    </Input>
                    {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
                  </VStack>
                )}
              />

              <Button onPress={handleSubmit(onSubmit)} isDisabled={isSigningIn} style={styles.primaryButton}>
                <ButtonText style={styles.primaryButtonText}>
                  {isSigningIn ? 'Logowanie...' : 'Zaloguj się'}
                </ButtonText>
              </Button>

              <Button variant="outline" onPress={onSmsLogin} isDisabled={isSendingSms} style={styles.secondaryButton}>
                <ButtonText style={styles.secondaryButtonText}>
                  {isSendingSms ? 'Wysyłanie SMS...' : 'Zaloguj przez SMS'}
                </ButtonText>
              </Button>

              <Button variant="outline" onPress={() => router.push('/register-resident')} style={styles.secondaryButton}>
                <ButtonText style={styles.secondaryButtonText}>Zarejestruj konto</ButtonText>
              </Button>

              <Button variant="outline" onPress={() => router.push('/recover-access-phone')} style={styles.ghostButton}>
                <ButtonText style={styles.ghostButtonText}>Nie pamiętam hasła</ButtonText>
              </Button>
            </VStack>
          </Box>
        </Animated.View>
      </View>
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 18,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    alignSelf: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.22)',
  },
  logo: {
    alignSelf: 'center',
    width: 124,
    height: 124,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...futuristicShadows.glow,
  },
  logoText: {
    color: futuristicTheme.colors.accent,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    padding: 18,
    ...futuristicShadows.soft,
  },
  label: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
  },
  inputText: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: 'rgba(13, 47, 79, 0.5)',
  },
  secondaryButtonText: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  ghostButton: {
    borderRadius: 14,
  },
  ghostButtonText: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 14,
  },
});
