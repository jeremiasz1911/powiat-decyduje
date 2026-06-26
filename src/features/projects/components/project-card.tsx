import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  getProjectStatusLabel,
  truncateText,
} from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type ProjectCardVoteAction = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

type ProjectCardProps = {
  project: ProjectItem;
  onOpenDetails: (projectId: string) => void;
  voteAction?: ProjectCardVoteAction;
};

function ProjectCardComponent({ project, onOpenDetails, voteAction }: ProjectCardProps) {
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const statusLabel = getProjectStatusLabel(project.status);
  const description = truncateText(project.description || 'Brak opisu');

  return (
    <View style={styles.card}>
      {project.imageUrl ? (
        <Image source={{ uri: project.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name={resolveProjectIcon(project.icon)} size={28} color={appColors.primary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {project.title}
        </Text>

        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Ionicons name="location-outline" size={14} color={appColors.textMuted} />
            <Text style={styles.infoChipText} numberOfLines={1}>
              {communeLabel}
            </Text>
          </View>
          <View style={styles.votesChip}>
            <Ionicons name="heart-outline" size={14} color={appColors.primary} />
            <Text style={styles.votesChipText}>{project.votesCount ?? 0}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onOpenDetails(project.id)}
            style={({ pressed }) => [styles.detailsButton, pressed ? styles.detailsButtonPressed : null]}>
            <Text style={styles.detailsButtonText}>Szczegoly</Text>
            <Ionicons name="arrow-forward" size={16} color={appColors.primary} />
          </Pressable>

          {voteAction ? (
            <Pressable
              onPress={voteAction.onPress}
              disabled={voteAction.disabled || voteAction.loading}
              style={({ pressed }) => [
                styles.voteButton,
                voteAction.disabled ? styles.voteButtonDisabled : null,
                pressed && !voteAction.disabled ? styles.voteButtonPressed : null,
              ]}>
              <Text
                style={[
                  styles.voteButtonText,
                  voteAction.disabled || voteAction.loading ? styles.voteButtonTextDisabled : null,
                ]}>
                {voteAction.loading ? 'Glosowanie…' : voteAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const ProjectCard = memo(ProjectCardComponent);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...appShadows.soft,
  },
  cardImage: {
    width: '100%',
    height: 152,
    backgroundColor: appColors.backgroundSoft,
  },
  imagePlaceholder: {
    width: '100%',
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  content: {
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    borderRadius: appTheme.radius.pill,
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    color: appColors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusBadge: {
    borderRadius: appTheme.radius.pill,
    backgroundColor: appColors.surfaceSoft,
    borderWidth: 1,
    borderColor: appColors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: appColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.sm,
    marginTop: 2,
  },
  infoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoChipText: {
    flex: 1,
    color: appColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  votesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: appTheme.radius.pill,
    backgroundColor: appColors.backgroundSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  votesChipText: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
  detailsButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.primary,
    backgroundColor: appColors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsButtonPressed: {
    backgroundColor: appColors.primarySoft,
  },
  detailsButtonText: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  voteButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: appColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...appShadows.button,
  },
  voteButtonPressed: {
    opacity: 0.92,
  },
  voteButtonDisabled: {
    backgroundColor: appColors.surfaceSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  voteButtonText: {
    color: appColors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  voteButtonTextDisabled: {
    color: appColors.textMuted,
  },
});
