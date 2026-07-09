import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { brandColors } from '@/src/theme/brand';

import { StaticPowiatLogoSymbol } from './PowiatLogoSymbol';

export type PowiatLogoProps = {
  size?: number;
  showSubtitle?: boolean;
  showTitle?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PowiatLogo({ size = 88, showSubtitle = false, showTitle = true, style }: PowiatLogoProps) {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="image"
      accessibilityLabel="Logo aplikacji Powiat Decyduje">
      <View style={[styles.symbolFrame, { width: size, height: size, borderRadius: size * 0.24 }]}>
        <StaticPowiatLogoSymbol size={size * 0.62} />
      </View>

      {showTitle ? (
        <Text style={styles.title} accessibilityRole="header">
          Powiat Decyduje
        </Text>
      ) : null}

      {showSubtitle ? <Text style={styles.subtitle}>Aplikacja dla mieszkańców</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  symbolFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.22)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
  title: {
    color: brandColors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: brandColors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
