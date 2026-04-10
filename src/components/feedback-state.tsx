import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Box, Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

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
      <ActivityIndicator size="large" color={futuristicTheme.colors.accent} />
      <Text color={futuristicTheme.colors.textMuted}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onActionPress }: EmptyStateProps) {
  return (
    <Box style={styles.card}>
      <VStack space="sm" alignItems="center">
        <Text style={styles.title}>{title}</Text>
        {description ? <Text color={futuristicTheme.colors.textMuted}>{description}</Text> : null}
        {actionLabel && onActionPress ? (
          <Button size="sm" action="secondary" variant="outline" onPress={onActionPress}>
            <ButtonText>{actionLabel}</ButtonText>
          </Button>
        ) : null}
      </VStack>
    </Box>
  );
}

export function ErrorState({
  title = 'Wystapil blad',
  message,
  actionLabel,
  onActionPress,
}: ErrorStateProps) {
  return (
    <Box style={styles.card}>
      <VStack space="sm" alignItems="center">
        <Text color={futuristicTheme.colors.danger} style={styles.title}>
          {title}
        </Text>
        <Text color={futuristicTheme.colors.textMuted}>{message}</Text>
        {actionLabel && onActionPress ? (
          <Button size="sm" action="negative" variant="outline" onPress={onActionPress}>
            <ButtonText>{actionLabel}</ButtonText>
          </Button>
        ) : null}
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 18,
    padding: 16,
    ...futuristicShadows.soft,
  },
  title: {
    fontWeight: '700',
    color: futuristicTheme.colors.textPrimary,
  },
});
