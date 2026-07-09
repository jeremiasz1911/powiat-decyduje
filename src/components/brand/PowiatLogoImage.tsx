import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

type PowiatLogoImageProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  /** Jasne logo na ciemnym tle — używa assets/brand/logo_white.png */
  variant?: 'light' | 'dark';
};

const LOGO_SOURCES = {
  light: require('@/assets/brand/powiat-decyduje-logo.png'),
  dark: require('@/assets/brand/logo_white.png'),
} as const;

export function PowiatLogoImage({
  width = 260,
  height = 340,
  style,
  variant = 'light',
}: PowiatLogoImageProps) {
  return (
    <Image
      source={LOGO_SOURCES[variant]}
      style={[styles.logo, { width, height }, style]}
      resizeMode="contain"
      accessibilityLabel="Logo aplikacji Powiat Decyduje"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
