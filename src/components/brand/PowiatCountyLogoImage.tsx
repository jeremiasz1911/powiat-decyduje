import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

const COUNTY_LOGO_ASPECT = 1280 / 1551;

type PowiatCountyLogoImageProps = {
  height?: number;
  maxWidth?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function PowiatCountyLogoImage({
  height = 48,
  maxWidth = 120,
  style,
  accessibilityLabel = 'Herb Powiatu Mławskiego',
}: PowiatCountyLogoImageProps) {
  const width = Math.min(Math.round(height * COUNTY_LOGO_ASPECT), maxWidth);

  return (
    <Image
      source={require('@/assets/brand/logoPowiat.png')}
      style={[styles.logo, { height, width }, style]}
      resizeMode="contain"
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
