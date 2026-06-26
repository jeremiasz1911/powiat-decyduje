import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  getProjectStatusLabel,
  truncateText,
} from '@/src/features/projects/utils';
import { type ProjectItem } from '@/src/services';
import { appColors, appTheme } from '@/src/theme/app-theme';

type MyProjectRowProps = {
  project: ProjectItem;
  onOpen: () => void;
  onEdit: () => void;
};

function resolveStatusStyle(status: string) {
  switch (status) {
    case 'approved':
    case 'active':
    case 'voting':
      return styles.statusBadgePositive;
    case 'completed':
      return styles.statusBadgeDone;
    case 'rejected':
      return styles.statusBadgeNegative;
    default:
      return styles.statusBadgeNeutral;
  }
}

export function MyProjectRow({ project, onOpen, onEdit }: MyProjectRowProps) {
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const statusLabel = getProjectStatusLabel(project.status);
  const locationLine =
    project.locationLabel?.trim() ||
    [project.village, project.commune].filter(Boolean).join(', ') ||
    communeLabel;
  const subtitle = truncateText(project.description?.trim() || locationLine, 96);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.mainArea, pressed ? styles.mainAreaPressed : null]}
        accessibilityRole="button"
        accessibilityLabel={`Podglad projektu ${project.title}`}>
        <View style={styles.iconWrap}>
          <Ionicons name={resolveProjectIcon(project.icon)} size={18} color={appColors.primary} />
        </View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {project.title}
            </Text>
            <View style={[styles.statusBadge, resolveStatusStyle(project.status)]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  project.status === 'rejected'
                    ? styles.statusBadgeTextNegative
                    : project.status === 'completed'
                      ? styles.statusBadgeTextDone
                      : project.status === 'approved' ||
                          project.status === 'active' ||
                          project.status === 'voting'
                        ? styles.statusBadgeTextPositive
                        : null,
                ]}
                numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={12} color={appColors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {categoryLabel} · {communeLabel}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.actionButton, pressed ? styles.actionButtonPressed : null]}
          hitSlop={6}>
          <Ionicons name="create-outline" size={14} color={appColors.primary} />
          <Text style={styles.actionText}>Edytuj</Text>
        </Pressable>
        <Pressable
          onPress={onOpen}
          style={({ pressed }) => [styles.actionButton, pressed ? styles.actionButtonPressed : null]}
          hitSlop={6}>
          <Ionicons name="eye-outline" size={14} color={appColors.primary} />
          <Text style={styles.actionText}>Podglad</Text>
        </Pressable>
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
  mainAreaPressed: {
    opacity: 0.76,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  title: {
    flex: 1,
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusBadge: {
    maxWidth: 112,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: appColors.textSecondary,
  },
  statusBadgeTextPositive: {
    color: appColors.primary,
  },
  statusBadgeTextDone: {
    color: '#15803D',
  },
  statusBadgeTextNegative: {
    color: appColors.danger,
  },
  statusBadgePositive: {
    backgroundColor: appColors.primarySoft,
  },
  statusBadgeDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  statusBadgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  statusBadgeNeutral: {
    backgroundColor: appColors.surfaceSoft,
  },
  subtitle: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    flex: 1,
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: appTheme.spacing.sm,
    paddingLeft: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionButtonPressed: {
    backgroundColor: appColors.primarySoft,
  },
  actionText: {
    color: appColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
