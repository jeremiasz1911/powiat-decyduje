import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { AppColorTokens } from '@/src/theme/app-theme';
import { appShadows, appTheme } from '@/src/theme/app-theme';
import { useAppTheme } from '@/src/theme/theme-context';

export type AppSelectOption = {
  label: string;
  value: string;
};

type AppSelectProps = {
  label: string;
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

function createSelectStyles(colors: AppColorTokens) {
  return StyleSheet.create({
    container: {
      gap: 6,
      flex: 1,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    trigger: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingHorizontal: appTheme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    triggerPressed: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    triggerText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    placeholderText: {
      color: colors.textMuted,
      fontWeight: '500',
    },
    webSelectWrap: {
      position: 'relative',
      justifyContent: 'center',
    },
    webChevron: {
      position: 'absolute',
      right: 14,
      pointerEvents: 'none',
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '70%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: appTheme.spacing.lg,
      ...appShadows.card,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: appTheme.spacing.lg,
      paddingVertical: appTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    optionRow: {
      minHeight: 52,
      paddingHorizontal: appTheme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    optionRowSelected: {
      backgroundColor: colors.primarySoft,
    },
    optionText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
  });
}

export function AppSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Wybierz…',
  containerStyle,
}: AppSelectProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createSelectStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? placeholder,
    [options, placeholder, value]
  );

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      {Platform.OS === 'web' ? (
        <View style={styles.webSelectWrap}>
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            style={{
              width: '100%',
              minHeight: 52,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceSoft,
              paddingLeft: 16,
              paddingRight: 40,
              fontSize: 16,
              color: colors.textPrimary,
              outline: 'none',
            }}>
            {options.map((option) => (
              <option key={option.value || '__all__'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} style={styles.webChevron} />
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setOpen(true)}
            style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
            accessibilityRole="button">
            <Text style={[styles.triggerText, !value ? styles.placeholderText : null]} numberOfLines={1}>
              {selectedLabel}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>

          <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
              <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{label}</Text>
                  <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.textPrimary} />
                  </Pressable>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value || '__all__'}
                  renderItem={({ item }) => {
                    const selected = item.value === value;
                    return (
                      <Pressable
                        onPress={() => handleSelect(item.value)}
                        style={[styles.optionRow, selected ? styles.optionRowSelected : null]}>
                        <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>
                          {item.label}
                        </Text>
                        {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                      </Pressable>
                    );
                  }}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}
