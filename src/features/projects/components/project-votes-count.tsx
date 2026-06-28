import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatVotesCountLabel } from '@/src/features/projects/utils';
import { appColors, appTheme } from '@/src/theme/app-theme';

type ProjectVotesCountProps = {
  count: number | null | undefined;
  loading?: boolean;
  error?: boolean;
  variant?: 'chip' | 'inline' | 'muted';
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProjectVotesCount({
  count,
  loading = false,
  error = false,
  variant = 'inline',
  showIcon = true,
  style,
}: ProjectVotesCountProps) {
  if (loading) {
    return (
      <View style={[styles.base, VARIANT_STYLES[variant].container, style]}>
        {showIcon ? <ActivityIndicator size="small" color={appColors.primary} /> : null}
        <Text style={[styles.text, VARIANT_STYLES[variant].text, styles.loadingText]}>Ładowanie…</Text>
      </View>
    );
  }

  if (error || (typeof count === 'number' && count < 0)) {
    return (
      <View style={[styles.base, VARIANT_STYLES[variant].container, style]}>
        {showIcon ? <Ionicons name="alert-circle-outline" size={13} color={appColors.textMuted} /> : null}
        <Text style={[styles.text, VARIANT_STYLES[variant].text, styles.errorText]} numberOfLines={1}>
          Brak danych o głosach
        </Text>
      </View>
    );
  }

  const label = formatVotesCountLabel(count ?? 0);

  return (
    <View style={[styles.base, VARIANT_STYLES[variant].container, style]}>
      {showIcon ? <Ionicons name="heart" size={13} color={appColors.primary} /> : null}
      <Text style={[styles.text, VARIANT_STYLES[variant].text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const VARIANT_STYLES = {
  chip: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: appTheme.radius.pill,
      backgroundColor: appColors.backgroundSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      color: appColors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
  }),
  inline: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    text: {
      color: appColors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
  }),
  muted: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    text: {
      color: appColors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
  }),
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    flexShrink: 1,
  },
  loadingText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
