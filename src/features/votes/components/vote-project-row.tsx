import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  truncateText,
} from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { appColors, appTheme } from '@/src/theme/app-theme';

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
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const subtitle = `${categoryLabel} · ${communeLabel} · ${project.votesCount ?? 0} glosow`;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.mainArea, pressed ? styles.mainAreaPressed : null]}
        accessibilityRole="button">
        <View style={styles.iconWrap}>
          <Ionicons name={resolveProjectIcon(project.icon)} size={18} color={appColors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {truncateText(subtitle, 72)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={appColors.textMuted} />
      </Pressable>

      <View style={styles.actionArea}>
        {alreadyVoted ? (
          <View style={styles.votedBadge}>
            <Ionicons name="checkmark" size={14} color={appColors.primary} />
            <Text style={styles.votedText}>Oddano</Text>
          </View>
        ) : voting ? (
          <ActivityIndicator size="small" color={appColors.primary} />
        ) : (
          <Pressable
            onPress={onVote}
            disabled={voteDisabled}
            style={({ pressed }) => [styles.voteAction, pressed && !voteDisabled ? styles.voteActionPressed : null]}
            hitSlop={6}>
            <Text style={[styles.voteActionText, voteDisabled ? styles.voteActionTextDisabled : null]}>
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
    backgroundColor: appColors.primarySoft,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitle: {
    color: appColors.textMuted,
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
  voteActionPressed: {
    backgroundColor: appColors.primarySoft,
  },
  voteActionText: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  voteActionTextDisabled: {
    color: appColors.textMuted,
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votedText: {
    color: appColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
