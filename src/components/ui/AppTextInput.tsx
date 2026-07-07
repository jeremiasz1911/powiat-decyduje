import { useMemo, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { KEYBOARD_DONE_ACCESSORY_ID, KeyboardDoneAccessory } from '@/src/components/ui/KeyboardDoneAccessory';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

export type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  smsCode?: boolean;
  variant?: 'default' | 'minimal';
};

export function AppTextInput({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  smsCode = false,
  variant = 'default',
  onFocus,
  onBlur,
  placeholderTextColor,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  multiline,
  blurOnSubmit,
  inputAccessoryViewID,
  ...props
}: AppTextInputProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const usesNumericKeyboard =
    keyboardType === 'number-pad' ||
    keyboardType === 'phone-pad' ||
    keyboardType === 'decimal-pad' ||
    smsCode;
  const resolvedReturnKeyType = returnKeyType ?? (usesNumericKeyboard ? 'done' : multiline ? 'default' : 'next');

  return (
    <View style={[styles.container, containerStyle]}>
      {usesNumericKeyboard ? <KeyboardDoneAccessory /> : null}
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={placeholderTextColor ?? colors.placeholder}
        returnKeyType={resolvedReturnKeyType}
        blurOnSubmit={blurOnSubmit ?? !multiline}
        inputAccessoryViewID={
          Platform.OS === 'ios' && usesNumericKeyboard ? KEYBOARD_DONE_ACCESSORY_ID : inputAccessoryViewID
        }
        onSubmitEditing={(event) => {
          onSubmitEditing?.(event);
          if (resolvedReturnKeyType === 'done' || usesNumericKeyboard) {
            Keyboard.dismiss();
          }
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          smsCode ? styles.smsInput : null,
          inputStyle,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], variant: 'default' | 'minimal') {
  const isMinimal = variant === 'minimal';

  return StyleSheet.create({
    container: {
      gap: isMinimal ? 8 : 6,
    },
    label: {
      color: isMinimal ? colors.textMuted : colors.textPrimary,
      fontSize: isMinimal ? 13 : 14,
      fontWeight: isMinimal ? '600' : '700',
      letterSpacing: isMinimal ? 0.2 : 0,
    },
    input: {
      minHeight: isMinimal ? 48 : 52,
      color: colors.textPrimary,
      fontSize: 16,
      ...(isMinimal
        ? {
            borderRadius: 0,
            borderWidth: 0,
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.border,
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
            paddingVertical: 10,
          }
        : {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceSoft,
            paddingHorizontal: appTheme.spacing.lg,
          }),
    },
    inputFocused: isMinimal
      ? {
          borderBottomColor: colors.primary,
          backgroundColor: 'transparent',
        }
      : {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        },
    inputError: isMinimal
      ? {
          borderBottomColor: colors.danger,
        }
      : {
          borderColor: colors.danger,
        },
    smsInput: {
      textAlign: 'center',
      letterSpacing: 8,
      fontSize: 22,
      fontWeight: '800',
      minHeight: 58,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
