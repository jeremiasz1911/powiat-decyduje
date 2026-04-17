import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.9);
  const logoRotate = useSharedValue(0);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    logoRotate.value = withSequence(
      withTiming(-4, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(4, { duration: 600, easing: Easing.inOut(Easing.cubic) }),
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
    glow.value = withRepeat(withTiming(1, { duration: 1600 }), -1, true);
  }, [glow, logoRotate, logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.9 + glow.value * 0.2 }],
  }));

  const handleStart = async () => {
    await secureStore.set(STORAGE_KEYS.onboardingCompleted, 'true');
    router.replace('/(drawer)/(tabs)/projects');
  };

  return (
    <LinearGradient
      colors={[futuristicTheme.colors.bgTop, '#0a2a48', futuristicTheme.colors.bgBottom]}
      style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.content}>
          <Animated.View style={[styles.glow, glowStyle]} />

          <Animated.View entering={FadeInDown.duration(700).springify()} style={[styles.logo, logoStyle]}>
            <Animated.Text style={styles.logoText}>PD</Animated.Text>
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(120).duration(650)} style={styles.title}>
            Powiat Decyduje
          </Animated.Text>

          <Animated.Text entering={FadeInUp.delay(240).duration(650)} style={styles.description}>
            Zglaszaj pomysly, glosuj na projekty i wspoltworz decyzje lokalnej spolecznosci.
          </Animated.Text>

          <AnimatedPressable
            entering={FadeInUp.delay(360).duration(650)}
            style={styles.button}
            onPress={handleStart}>
            <Animated.Text style={styles.buttonText}>Zaczynamy</Animated.Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(34, 211, 238, 0.35)',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: futuristicTheme.colors.panel,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...futuristicShadows.glow,
  },
  logoText: {
    color: futuristicTheme.colors.accent,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: futuristicTheme.colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: futuristicTheme.colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 34,
    maxWidth: 360,
  },
  button: {
    backgroundColor: futuristicTheme.colors.accent,
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 999,
    ...futuristicShadows.glow,
  },
  buttonText: {
    color: futuristicTheme.colors.textDark,
    fontWeight: '700',
    fontSize: 16,
  },
});
