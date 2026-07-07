import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatVotesCountLabel } from '@/src/features/projects/utils';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

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
  const { colors } = useAppTheme();

  const variantStyles = {
    chip: {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        borderRadius: appTheme.radius.pill,
        backgroundColor: colors.backgroundSoft,
        paddingHorizontal: 8,
        paddingVertical: 4,
      },
      text: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800' as const,
      },
    },
    inline: {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
      },
      text: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700' as const,
      },
    },
    muted: {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
      },
      text: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '600' as const,
      },
    },
  }[variant];

  if (loading) {
    return (
      <View style={[styles.base, variantStyles.container, style]}>
        {showIcon ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        <Text style={[styles.text, variantStyles.text, { color: colors.textMuted, fontSize: 12, fontWeight: '600' }]}>
          Ładowanie…
        </Text>
      </View>
    );
  }

  if (error || (typeof count === 'number' && count < 0)) {
    return (
      <View style={[styles.base, variantStyles.container, style]}>
        {showIcon ? <Ionicons name="alert-circle-outline" size={13} color={colors.textMuted} /> : null}
        <Text style={[styles.text, variantStyles.text, { color: colors.textMuted, fontSize: 12, fontWeight: '600' }]} numberOfLines={1}>
          Brak danych o głosach
        </Text>
      </View>
    );
  }

  const label = formatVotesCountLabel(count ?? 0);

  return (
    <View style={[styles.base, variantStyles.container, style]}>
      {showIcon ? <Ionicons name="heart" size={13} color={colors.primary} /> : null}
      <Text style={[styles.text, variantStyles.text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    flexShrink: 1,
  },
});
