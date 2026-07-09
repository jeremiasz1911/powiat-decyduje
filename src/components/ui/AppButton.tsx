import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type AppButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  loadingTitle?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  loadingTitle,
  style,
  textStyle,
  fullWidth = true,
}: AppButtonProps) {
  const { colors, shadows } = useAppTheme();
  const pressScale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    pressScale.value = withTiming(0.97, { duration: 90 });
  };

  const handlePressOut = () => {
    pressScale.value = withSequence(
      withTiming(0.97, { duration: 0 }),
      withSpring(1, { damping: 10, stiffness: 220 })
    );
  };

  const variantStyles = {
    primary: {
      button: {
        backgroundColor: colors.primary,
        borderRadius: appTheme.radius.pill,
        ...shadows.button,
      },
      text: { color: colors.textOnPrimary },
    },
    secondary: {
      button: {
        backgroundColor: colors.surface,
        borderRadius: appTheme.radius.pill,
        borderWidth: 1,
        borderColor: colors.primary,
      },
      text: { color: colors.primary },
    },
    ghost: {
      button: {
        backgroundColor: 'transparent',
        borderRadius: appTheme.radius.md,
      },
      text: { color: colors.primary, fontWeight: '700' as const },
    },
    danger: {
      button: {
        backgroundColor: colors.danger,
        borderRadius: appTheme.radius.pill,
      },
      text: { color: colors.textOnPrimary },
    },
  }[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        fullWidth ? styles.fullWidth : null,
        variantStyles.button,
        isDisabled ? styles.disabled : null,
        animatedStyle,
        style,
      ]}>
      <View style={styles.content}>
        <Text style={[styles.text, variantStyles.text, textStyle]}>
          {loading ? (loadingTitle ?? 'Ładowanie...') : title}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: appTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
});
