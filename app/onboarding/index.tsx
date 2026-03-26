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
    <LinearGradient colors={['#0f172a', '#1e3a8a', '#38bdf8']} style={styles.gradient}>
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
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#93c5fd',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 34,
    maxWidth: 360,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 34,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
});
