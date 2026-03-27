import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Box, Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';

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
      <ActivityIndicator size="large" color="#2563eb" />
      <Text color="$textLight600">{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onActionPress }: EmptyStateProps) {
  return (
    <Box style={styles.card}>
      <VStack space="sm" alignItems="center">
        <Text style={styles.title}>{title}</Text>
        {description ? <Text color="$textLight600">{description}</Text> : null}
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
        <Text color="$error700" style={styles.title}>
          {title}
        </Text>
        <Text color="$error600">{message}</Text>
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
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
  },
  title: {
    fontWeight: '700',
  },
});
