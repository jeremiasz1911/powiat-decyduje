import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PROJECT_MARKER_COLORS,
  resolveProjectMarkerColor,
} from '@/src/features/projects/project-marker-colors';
import { appColors, appTheme } from '@/src/theme/app-theme';

type MarkerColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export function MarkerColorPicker({ value, onChange }: MarkerColorPickerProps) {
  const selected = resolveProjectMarkerColor(value);

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {PROJECT_MARKER_COLORS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={({ pressed }) => [
                styles.swatch,
                { backgroundColor: option.id },
                isSelected ? styles.swatchSelected : null,
                pressed ? styles.pressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Kolor pinezki: ${option.label}`}
              accessibilityState={{ selected: isSelected }}
            />
          );
        })}
      </View>
      <Text style={styles.hint}>Kolor pinezki na mapie powiatu.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: appTheme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  swatchSelected: {
    borderColor: appColors.textPrimary,
    transform: [{ scale: 1.06 }],
  },
  hint: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.88,
  },
});
