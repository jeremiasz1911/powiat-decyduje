import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompactIconAction } from '@/src/features/projects/components/compact-icon-action';
import { ProjectRemoteImage } from '@/src/features/projects/components/project-remote-image';
import { ProjectStatusBadge } from '@/src/features/projects/components/project-status-badge';
import { ProjectVotesCount } from '@/src/features/projects/components/project-votes-count';
import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  getProjectImageUrls,
  truncateText,
} from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

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
  variant?: 'default' | 'flat';
};

function ProjectCardComponent({ project, onOpenDetails, voteAction, variant = 'default' }: ProjectCardProps) {
  const { colors, shadows } = useAppTheme();
  const isFlat = variant === 'flat';
  const images = getProjectImageUrls(project);
  const coverImage = images[0];
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const description = truncateText(project.description || 'Brak opisu', 120);
  const locationLine =
    project.locationLabel?.trim() || [project.village, project.commune].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={() => onOpenDetails(project.id)}
      style={({ pressed }) => [
        styles.card,
        isFlat ? styles.cardFlat : null,
        {
          borderColor: colors.border,
          backgroundColor: isFlat ? 'transparent' : colors.surface,
        },
        isFlat ? null : shadows.soft,
        pressed ? styles.cardPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Otwórz szczegóły projektu ${project.title}`}>
      <View style={styles.imageArea}>
        {coverImage ? (
          <ProjectRemoteImage
            uri={coverImage}
            style={[styles.cardImage, { backgroundColor: colors.backgroundSoft }]}
            resizeMode="cover"
            fallbackIcon={project.icon}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={resolveProjectIcon(project.icon)} size={28} color={colors.primary} />
          </View>
        )}
        {images.length > 1 ? (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={12} color={colors.textOnPrimary} />
            <Text style={[styles.imageCountText, { color: colors.textOnPrimary }]}>{images.length}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.badgesRow}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="pricetag-outline" size={11} color={colors.primary} />
            <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{categoryLabel}</Text>
          </View>
          <ProjectStatusBadge status={project.status} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {project.title}
        </Text>

        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Ionicons name="business-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.infoChipText, { color: colors.textSecondary }]} numberOfLines={1}>
              {communeLabel}
            </Text>
          </View>
          {locationLine ? (
            <View style={styles.infoChip}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.infoChipText, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLine}
              </Text>
            </View>
          ) : null}
          <ProjectVotesCount count={project.votesCount} variant="chip" style={styles.votesChip} />
        </View>

        {voteAction ? (
          <View style={styles.voteRow}>
            <CompactIconAction
              icon="heart-outline"
              label={voteAction.loading ? 'Głosowanie…' : voteAction.label}
              onPress={voteAction.onPress}
              accessibilityLabel={voteAction.label}
              variant="primary"
              disabled={voteAction.disabled || voteAction.loading}
              loading={voteAction.loading}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProjectCard = memo(ProjectCardComponent);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardFlat: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardPressed: {
    opacity: 0.94,
  },
  imageArea: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 148,
  },
  imagePlaceholder: {
    width: '100%',
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCountBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 29, 43, 0.72)',
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: appTheme.spacing.md,
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '46%',
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  votesChip: {
    marginLeft: 'auto',
  },
  voteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
});
