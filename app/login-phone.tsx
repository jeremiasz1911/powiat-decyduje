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
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
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

import { AppScreen } from '@/src/components/layout/app-screen';
import { residentLoginSchema, type ResidentLoginFormValues } from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { loginWithIdentifier } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function LoginPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { refreshResidentAccounts, setActiveResidentAccountId } = useAuthContext();
  const [isSigningIn, setIsSigningIn] = useState(false);

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
    router.replace('/(drawer)/(tabs)/projects');
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
    <AppScreen
      gradientColors={[futuristicTheme.colors.bgTop, '#061b33', futuristicTheme.colors.bgBottom]}
      contentContainerStyle={styles.safeArea}>
      <Animated.View entering={FadeIn.duration(700)} style={styles.content}>
        <Animated.View style={[styles.glow, glowStyle]} />

        <Animated.View entering={FadeInDown.duration(700).springify()} style={[styles.logo, logoStyle]}>
          <Text style={styles.logoText}>PD</Text>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(120).duration(650)} style={styles.title}>
          Powiat Decyduje
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(240).duration(650)} style={styles.subtitle}>
          Zaloguj się do Powiat Decyduje.
        </Animated.Text>

        <Box style={styles.card}>
          <VStack space="md">
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <VStack space="xs">
                  <Text style={styles.label}>Email lub numer telefonu</Text>
                  <Input style={styles.input}>
                    <InputField
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="jan@example.com lub 500 600 700"
                      placeholderTextColor={futuristicTheme.colors.textMuted}
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

            <Button variant="outline" onPress={() => router.push('/register-resident')} style={styles.secondaryButton}>
              <ButtonText style={styles.secondaryButtonText}>Zarejestruj konto</ButtonText>
            </Button>

            <Button variant="outline" onPress={() => router.push('/recover-access-phone')} style={styles.ghostButton}>
              <ButtonText style={styles.ghostButtonText}>Nie pamiętam hasła</ButtonText>
            </Button>
          </VStack>
        </Box>
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
