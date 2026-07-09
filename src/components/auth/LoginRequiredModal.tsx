import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/ui/AppButton';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type LoginRequiredModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export function LoginRequiredModal({
  visible,
  onClose,
  title = 'Zaloguj się, aby kontynuować',
  description = 'Głosowanie i zgłaszanie projektów wymaga konta mieszkańca.',
}: LoginRequiredModalProps) {
  const router = useRouter();
  const { colors, shadows } = useAppTheme();

  const goToLogin = () => {
    onClose();
    router.push('/login-phone');
  };

  const goToRegister = () => {
    onClose();
    router.push('/register-resident');
  };

  const goToMap = () => {
    onClose();
    router.replace('/(drawer)/(tabs)/map');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
            shadows.card,
          ]}
          onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>

          <View style={styles.actions}>
            <AppButton title="Zaloguj się" onPress={goToLogin} />
            <AppButton title="Utwórz konto" variant="secondary" onPress={goToRegister} />
            <AppButton title="Wróć do mapy" variant="ghost" onPress={goToMap} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.lg,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
});
