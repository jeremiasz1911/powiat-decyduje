import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompactIconAction } from '@/src/features/projects/components/compact-icon-action';
import { ProjectStatusBadge } from '@/src/features/projects/components/project-status-badge';
import { ProjectVotesCount } from '@/src/features/projects/components/project-votes-count';
import { isProjectPubliclyVisible } from '@/src/features/projects/project-status';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  truncateText,
} from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type MapProjectCalloutCardProps = {
  project: ProjectItem;
  onClose: () => void;
  onOpenDetails: (projectId: string) => void;
};

export function MapProjectCalloutCard({ project, onClose, onOpenDetails }: MapProjectCalloutCardProps) {
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const description = truncateText(project.description || 'Brak opisu', 110);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {project.title}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
            accessibilityLabel="Zamknij podgląd projektu">
            <Ionicons name="close" size={18} color={appColors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>

        {!isProjectPubliclyVisible(project.status) ? (
          <View style={styles.pendingNotice}>
            <ProjectStatusBadge status={project.status} />
            <Text style={styles.pendingText}>
              Widoczny tylko dla Ciebie do czasu akceptacji przez administratora.
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="pricetag-outline" size={13} color={appColors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="business-outline" size={13} color={appColors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {communeLabel}
            </Text>
          </View>
          <ProjectVotesCount count={project.votesCount} variant="chip" />
        </View>

        <View style={styles.actions}>
          <CompactIconAction
            icon="arrow-forward"
            label="Szczegóły"
            onPress={() => onOpenDetails(project.id)}
            accessibilityLabel="Otwórz szczegóły projektu"
            variant="primary"
          />
        </View>
      </View>
      <View style={styles.pointer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
    ...appShadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
  },
  title: {
    flex: 1,
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surfaceSoft,
  },
  description: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  pendingNotice: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pendingText: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '46%',
  },
  metaText: {
    color: appColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  pointer: {
    width: 14,
    height: 14,
    backgroundColor: appColors.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: appColors.border,
    transform: [{ rotate: '45deg' }],
    marginTop: -8,
  },
  pressed: {
    opacity: 0.8,
  },
});
