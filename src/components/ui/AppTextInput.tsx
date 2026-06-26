import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { appColors, appTheme } from '@/src/theme/app-theme';

export type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  smsCode?: boolean;
};

export function AppTextInput({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  smsCode = false,
  onFocus,
  onBlur,
  placeholderTextColor = appColors.placeholder,
  ...props
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        placeholderTextColor={placeholderTextColor}
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

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 29, 43, 0.12)',
    backgroundColor: appColors.surfaceSoft,
    paddingHorizontal: appTheme.spacing.lg,
    color: appColors.textPrimary,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: appColors.primary,
    backgroundColor: appColors.surface,
  },
  inputError: {
    borderColor: appColors.danger,
  },
  smsInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '800',
    minHeight: 58,
  },
  errorText: {
    color: appColors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  helperText: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
