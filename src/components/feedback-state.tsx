import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

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

export function LoadingState({ label = 'Ladowanie...' }: LoadingStateProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={appColors.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onActionPress }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Wystapil blad',
  message,
  actionLabel,
  onActionPress,
}: ErrorStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.description}>{message}</Text>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingLabel: {
    color: appColors.textMuted,
    fontSize: 14,
  },
  card: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 16,
    padding: appTheme.spacing.lg,
    ...appShadows.soft,
  },
  title: {
    fontWeight: '800',
    color: appColors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontWeight: '800',
    color: appColors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  action: {
    marginTop: appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderRadius: 10,
  },
  actionPressed: {
    backgroundColor: appColors.primarySoft,
  },
  actionText: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
