import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

type PowiatLogoImageProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function PowiatLogoImage({
  width = 260,
  height = 340,
  style,
}: PowiatLogoImageProps) {
  return (
    <Image
      source={require('@/assets/brand/powiat-decyduje-logo.png')}
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
