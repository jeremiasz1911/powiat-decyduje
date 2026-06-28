import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { getProjectStatusLabel, getProjectStatusTone } from '@/src/features/projects/utils';
import { appColors } from '@/src/theme/app-theme';

type ProjectStatusBadgeProps = {
  status?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function ProjectStatusBadge({ status, style }: ProjectStatusBadgeProps) {
  const label = getProjectStatusLabel(status);
  const tone = getProjectStatusTone(status);

  return (
    <View style={[styles.badge, TONE_STYLES[tone].badge, style]}>
      <Text style={[styles.text, TONE_STYLES[tone].text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const TONE_STYLES = {
  positive: StyleSheet.create({
    badge: { backgroundColor: appColors.primarySoft },
    text: { color: appColors.primary },
  }),
  done: StyleSheet.create({
    badge: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
    text: { color: '#15803D' },
  }),
  negative: StyleSheet.create({
    badge: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
    text: { color: appColors.danger },
  }),
  neutral: StyleSheet.create({
    badge: { backgroundColor: appColors.surfaceSoft },
    text: { color: appColors.textSecondary },
  }),
};

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
