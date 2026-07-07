import { useMemo, useRef } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { KEYBOARD_DONE_ACCESSORY_ID, KeyboardDoneAccessory } from '@/src/components/ui/KeyboardDoneAccessory';
import { useAppTheme } from '@/src/theme/theme-context';

type DigitCodeInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  helperText?: string;
  successText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
};

function sanitizeDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function DigitCodeInput({
  length,
  value,
  onChange,
  onBlur,
  label,
  error,
  helperText,
  successText,
  containerStyle,
  autoFocus = false,
}: DigitCodeInputProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);
  const digits = sanitizeDigits(value, length).split('');

  const handleChange = (nextValue: string) => {
    const sanitized = sanitizeDigits(nextValue, length);
    onChange(sanitized);
    if (sanitized.length === length) {
      inputRef.current?.blur();
      Keyboard.dismiss();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <KeyboardDoneAccessory />
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.cellsWrap, error ? styles.cellsWrapError : null]}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Pole numeryczne'}>
        {Array.from({ length }, (_, index) => {
          const digit = digits[index] ?? '';
          const isActive = digits.length === index;
          const isFilled = digit.length > 0;

          return (
            <View
              key={index}
              style={[
                styles.cell,
                isFilled ? styles.cellFilled : null,
                isActive ? styles.cellActive : null,
                error ? styles.cellError : null,
              ]}>
              <Text style={styles.cellText}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={sanitizeDigits(value, length)}
        onChangeText={handleChange}
        onBlur={onBlur}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        returnKeyType="done"
        blurOnSubmit
        inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_DONE_ACCESSORY_ID : undefined}
        onSubmitEditing={() => {
          inputRef.current?.blur();
          Keyboard.dismiss();
        }}
        caretHidden
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
        style={styles.hiddenInput}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && successText ? <Text style={styles.successText}>{successText}</Text> : null}
      {!error && !successText && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    cellsWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    cellsWrapError: {
      opacity: 0.98,
    },
    cell: {
      flex: 1,
      minWidth: 0,
      maxWidth: 34,
      aspectRatio: 0.82,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    cellActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 2,
    },
    cellError: {
      borderColor: colors.danger,
    },
    cellText: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '800',
      lineHeight: 22,
    },
    hiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    successText: {
      color: colors.success,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
