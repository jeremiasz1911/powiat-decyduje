import { StyleSheet, Text, View } from 'react-native';

import { appColors, appTheme } from '@/src/theme/app-theme';

type StepIndicatorProps = {
  current: number;
  total: number;
  labels?: string[];
};

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <View style={styles.root}>
      <View style={styles.stepsRow}>
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const active = step === current;
          const completed = step < current;

          return (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.dot,
                  active ? styles.dotActive : null,
                  completed ? styles.dotCompleted : null,
                ]}>
                <Text
                  style={[
                    styles.dotText,
                    active ? styles.dotTextActive : null,
                    completed ? styles.dotTextCompleted : null,
                  ]}>
                  {step}
                </Text>
              </View>
              {index < total - 1 ? (
                <View style={[styles.connector, completed ? styles.connectorCompleted : null]} />
              ) : null}
            </View>
          );
        })}
      </View>
      {labels?.[current - 1] ? <Text style={styles.label}>{labels[current - 1]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  dotCompleted: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primary,
  },
  dotText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  dotTextActive: {
    color: appColors.primary,
  },
  dotTextCompleted: {
    color: appColors.textOnPrimary,
  },
  connector: {
    width: 36,
    height: 2,
    backgroundColor: appColors.border,
    marginHorizontal: 6,
  },
  connectorCompleted: {
    backgroundColor: appColors.primary,
  },
  label: {
    textAlign: 'center',
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
