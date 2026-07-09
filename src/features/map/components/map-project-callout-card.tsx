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
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type MapProjectCalloutCardProps = {
  project: ProjectItem;
  onClose: () => void;
  onOpenDetails: (projectId: string) => void;
};

export function MapProjectCalloutCard({ project, onClose, onOpenDetails }: MapProjectCalloutCardProps) {
  const { colors, shadows } = useAppTheme();
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const description = truncateText(project.description || 'Brak opisu', 110);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
          shadows.card,
        ]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {project.title}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.surfaceSoft },
              pressed ? styles.pressed : null,
            ]}
            accessibilityLabel="Zamknij podgląd projektu">
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={3}>
          {description}
        </Text>

        {!isProjectPubliclyVisible(project.status) ? (
          <View
            style={[
              styles.pendingNotice,
              { borderColor: colors.border, backgroundColor: colors.surfaceSoft },
            ]}>
            <ProjectStatusBadge status={project.status} />
            <Text style={[styles.pendingText, { color: colors.textMuted }]}>
              Widoczny tylko dla Ciebie do czasu akceptacji przez administratora.
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="pricetag-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="business-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
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
      <View
        style={[
          styles.pointer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      />
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
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
  },
  title: {
    flex: 1,
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
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  pendingNotice: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pendingText: {
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
    borderRightWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: '45deg' }],
    marginTop: -8,
  },
  pressed: {
    opacity: 0.8,
  },
});
