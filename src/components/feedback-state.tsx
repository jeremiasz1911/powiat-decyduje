import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/src/components/ui/AppButton';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type LoadingStateProps = {
  label?: string;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

type ErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function LoadingState({ label = 'Ładowanie...' }: LoadingStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onActionPress }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.state}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text> : null}
      {actionLabel && onActionPress ? (
        <AppButton title={actionLabel} onPress={onActionPress} variant="secondary" fullWidth={false} style={styles.actionButton} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Wystąpił błąd',
  message,
  actionLabel,
  onActionPress,
}: ErrorStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.state}>
      <Text style={[styles.errorTitle, { color: colors.danger }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>{message}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [styles.textAction, pressed ? { opacity: 0.7 } : null]}>
          <Text style={[styles.textActionLabel, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  loadingLabel: {
    fontSize: 14,
  },
  state: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.xl,
    paddingHorizontal: appTheme.spacing.md,
  },
  title: {
    fontWeight: '800',
    fontSize: 17,
    textAlign: 'center',
  },
  errorTitle: {
    fontWeight: '800',
    fontSize: 17,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
  actionButton: {
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.xl,
  },
  textAction: {
    marginTop: appTheme.spacing.xs,
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
  },
  textActionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
