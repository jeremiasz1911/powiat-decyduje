import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  formatVotesCountLabel,
  truncateText,
} from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type VoteProjectRowProps = {
  project: ProjectItem;
  alreadyVoted: boolean;
  voting: boolean;
  voteDisabled: boolean;
  onOpen: () => void;
  onVote: () => void;
};

export function VoteProjectRow({
  project,
  alreadyVoted,
  voting,
  voteDisabled,
  onOpen,
  onVote,
}: VoteProjectRowProps) {
  const { colors } = useAppTheme();
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const votesLabel =
    project.votesCount < 0 ? 'Brak danych o głosach' : formatVotesCountLabel(project.votesCount);
  const subtitle = `${categoryLabel} · ${communeLabel} · ${votesLabel}`;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.mainArea, pressed ? styles.mainAreaPressed : null]}
        accessibilityRole="button">
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={resolveProjectIcon(project.icon)} size={18} color={colors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {truncateText(subtitle, 72)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <View style={styles.actionArea}>
        {alreadyVoted ? (
          <View style={styles.votedBadge}>
            <Ionicons name="checkmark" size={14} color={colors.primary} />
            <Text style={[styles.votedText, { color: colors.primary }]}>Oddano</Text>
          </View>
        ) : voting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Pressable
            onPress={onVote}
            disabled={voteDisabled}
            style={({ pressed }) => [
              styles.voteAction,
              pressed && !voteDisabled ? { backgroundColor: colors.primarySoft } : null,
            ]}
            hitSlop={6}>
            <Text
              style={[
                styles.voteActionText,
                { color: voteDisabled ? colors.textMuted : colors.primary },
              ]}>
              Glosuj
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingLeft: appTheme.spacing.md,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingVertical: 10,
    paddingRight: appTheme.spacing.sm,
  },
  mainAreaPressed: {
    opacity: 0.72,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionArea: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: appTheme.spacing.md,
  },
  voteAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  voteActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votedText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
