import { Button, InputAccessoryView, Keyboard, Platform, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

export const KEYBOARD_DONE_ACCESSORY_ID = 'app-keyboard-done';

type KeyboardDoneAccessoryProps = {
  onDone?: () => void;
};

export function KeyboardDoneAccessory({ onDone }: KeyboardDoneAccessoryProps) {
  const { colors } = useAppTheme();

  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleDone = () => {
    onDone?.();
    Keyboard.dismiss();
  };

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ACCESSORY_ID}>
      <View style={[styles.bar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Button title="Gotowe" onPress={handleDone} color={colors.primary} />
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
  },
});
