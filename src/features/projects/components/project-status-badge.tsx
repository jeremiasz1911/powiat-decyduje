import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { getProjectStatusLabel, getProjectStatusTone } from '@/src/features/projects/utils';
import { useAppTheme } from '@/src/theme/theme-context';

type ProjectStatusBadgeProps = {
  status?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function ProjectStatusBadge({ status, style }: ProjectStatusBadgeProps) {
  const { colors } = useAppTheme();
  const label = getProjectStatusLabel(status);
  const tone = getProjectStatusTone(status);

  const toneStyles = {
    positive: {
      badge: { backgroundColor: colors.primarySoft },
      text: { color: colors.primary },
    },
    done: {
      badge: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
      text: { color: colors.success },
    },
    negative: {
      badge: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
      text: { color: colors.danger },
    },
    neutral: {
      badge: { backgroundColor: colors.surfaceSoft },
      text: { color: colors.textSecondary },
    },
  }[tone];

  return (
    <View style={[styles.badge, toneStyles.badge, style]}>
      <Text style={[styles.text, toneStyles.text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    maxWidth: 140,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
