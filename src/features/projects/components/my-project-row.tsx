import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CompactIconAction } from '@/src/features/projects/components/compact-icon-action';
import { ProjectStatusBadge } from '@/src/features/projects/components/project-status-badge';
import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  getProjectImageUrls,
  truncateText,
} from '@/src/features/projects/utils';
import { normalizeProjectStatus } from '@/src/features/projects/project-status';
import { type ProjectItem } from '@/src/services';
import { appColors, appTheme } from '@/src/theme/app-theme';

type MyProjectRowProps = {
  project: ProjectItem;
  onOpen: () => void;
  onEdit: () => void;
};

export function MyProjectRow({ project, onOpen, onEdit }: MyProjectRowProps) {
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const images = getProjectImageUrls(project);
  const coverImage = images[0];
  const locationLine =
    project.locationLabel?.trim() ||
    [project.village, project.commune].filter(Boolean).join(', ') ||
    communeLabel;
  const subtitle = truncateText(project.description?.trim() || locationLine, 88);
  const canEdit = normalizeProjectStatus(project.status) === 'submitted';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.mainArea, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel={`Podgląd projektu ${project.title}`}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.iconWrap}>
            <Ionicons name={resolveProjectIcon(project.icon)} size={18} color={appColors.primary} />
          </View>
        )}

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {project.title}
            </Text>
            <ProjectStatusBadge status={project.status} />
          </View>

          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="pricetag-outline" size={12} color={appColors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={12} color={appColors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {communeLabel}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={appColors.textMuted} style={styles.chevron} />
      </Pressable>

      <View style={styles.actions}>
        {canEdit ? (
          <CompactIconAction
            icon="create-outline"
            onPress={onEdit}
            accessibilityLabel={`Edytuj projekt ${project.title}`}
            variant="primary"
          />
        ) : null}
        <CompactIconAction
          icon="eye-outline"
          onPress={onOpen}
          accessibilityLabel={`Podgląd projektu ${project.title}`}
          variant="default"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingLeft: appTheme.spacing.md,
    paddingRight: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.sm,
    gap: appTheme.spacing.xs,
  },
  mainArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
  },
  pressed: {
    opacity: 0.76,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: appColors.surfaceSoft,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  metaText: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  chevron: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: appTheme.spacing.sm,
    paddingLeft: 56,
  },
});
