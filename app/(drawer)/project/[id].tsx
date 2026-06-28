import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { SettingsCard, SettingsGroup } from '@/src/components/settings/settings-ui';
import { CompactIconAction } from '@/src/features/projects/components/compact-icon-action';
import { ProjectImageGallery } from '@/src/features/projects/components/project-image-gallery';
import { ProjectStatusBadge } from '@/src/features/projects/components/project-status-badge';
import { ProjectVotesCount } from '@/src/features/projects/components/project-votes-count';
import { RichDescriptionPreview } from '@/src/features/projects/components/rich-description-preview';
import { VoteAnonymousToggle } from '@/src/features/projects/components/vote-anonymous-toggle';
import { resolveProjectMarkerColor } from '@/src/features/projects/project-marker-colors';
import { resolveProjectIcon } from '@/src/features/projects/project-icons';
import {
  canUserEditProject,
  canVoteOnProject,
  getProjectAuthorId,
  normalizeProjectStatus,
} from '@/src/features/projects/project-status';
import {
  getProjectCategoryLabel,
  getProjectCommuneLabel,
  getProjectCoordinates,
  getProjectImageUrls,
  getProjectStatusLabel,
} from '@/src/features/projects/utils';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  ensureAnonymousAuth,
  getInstallationId,
  getProjectById,
  voteForProject,
  type ProjectItem,
} from '@/src/services';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type DetailStatProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

function DetailStat({ icon, label, value }: DetailStatProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={15} color={appColors.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function ProjectDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = params.id ?? '';
  const { notify } = useAppFeedback();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [voteAnonymously, setVoteAnonymously] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setError('Brak identyfikatora projektu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await ensureAnonymousAuth();
      setCurrentUserId(user.uid);
      const data = await getProjectById(projectId, { userId: user.uid });
      setProject(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Nie udało się pobrać projektu.';
      setError(message);
      await notify('Błąd projektu', message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify, projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const handleVote = async () => {
    if (!project) {
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const user = await ensureAnonymousAuth();
      const installationId = await getInstallationId();
      const result = await voteForProject(project.id, user.uid, installationId, {
        anonymous: voteAnonymously,
      });

      setProject((prev) =>
        prev
          ? {
              ...prev,
              votesCount: result.votesCount,
            }
          : prev
      );

      if (!result.added) {
        if (result.reason === 'vote_limit_reached') {
          const message = 'Wykorzystałeś limit 5 głosów.';
          setError(message);
          await notify('Limit głosów', message, 'error');
        } else {
          const message = 'Już oddałeś głos na ten projekt.';
          setError(message);
          await notify('Duplikat głosu', message, 'error');
        }
      } else {
        await notify(
          'Dziękujemy',
          voteAnonymously ? 'Twój anonimowy głos został zapisany.' : 'Twój głos został zapisany.',
          'success'
        );
      }

      setRemainingVotes(result.remainingVotes);
    } catch (voteError) {
      const message = voteError instanceof Error ? voteError.message : 'Nie udało się oddać głosu.';
      setError(message);
      await notify('Błąd głosowania', message, 'error');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Ładuję szczegóły projektu..." />;
  }

  if (!project) {
    return (
      <AppScreen cherryBackground>
        <ErrorState
          message={error ?? 'Projekt nie istnieje.'}
          actionLabel="Spróbuj ponownie"
          onActionPress={() => void loadProject()}
        />
      </AppScreen>
    );
  }

  const images = getProjectImageUrls(project);
  const categoryLabel = getProjectCategoryLabel(project.category);
  const communeLabel = getProjectCommuneLabel(project.commune);
  const statusLabel = getProjectStatusLabel(project.status);
  const coordinates = getProjectCoordinates(project);
  const coordinatesValue = coordinates
    ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
    : 'Brak przypisanej lokalizacji na mapie';
  const locationLine =
    project.locationLabel?.trim() ||
    [project.village, project.commune].filter(Boolean).join(', ') ||
    communeLabel;
  const canEdit = canUserEditProject(project, currentUserId);
  const canVote = canVoteOnProject(project.status);
  const normalizedStatus = normalizeProjectStatus(project.status);
  const isOwner = Boolean(currentUserId && getProjectAuthorId(project) === currentUserId);
  const markerColor = resolveProjectMarkerColor(project.markerColor);

  return (
    <AppScreen cherryBackground scroll contentContainerStyle={styles.content}>
      <View style={styles.sections}>
        <SettingsCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: `${markerColor}22` }]}>
              <Ionicons name={resolveProjectIcon(project.icon)} size={26} color={markerColor} />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.title}>{project.title}</Text>
              <View style={styles.heroMeta}>
                <ProjectStatusBadge status={project.status} />
                <ProjectVotesCount count={project.votesCount} variant="chip" />
              </View>
            </View>
          </View>
        </SettingsCard>

        {normalizedStatus === 'submitted' && isOwner ? (
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={18} color={appColors.textMuted} />
            <Text style={styles.infoText}>
              Projekt oczekuje na weryfikację. Po zaakceptowaniu przez administratora będzie widoczny
              publicznie na liście projektów i mapie.
            </Text>
          </View>
        ) : null}

        {normalizedStatus === 'rejected' ? (
          <View style={styles.rejectedBox}>
            <Ionicons name="close-circle-outline" size={18} color={appColors.danger} />
            <View style={styles.rejectedBody}>
              <Text style={styles.rejectedTitle}>Projekt został odrzucony</Text>
              <Text style={styles.rejectedText}>
                {project.rejectionReason?.trim() ||
                  'Projekt nie został zaakceptowany i nie jest widoczny publicznie.'}
              </Text>
            </View>
          </View>
        ) : null}

        {images.length > 0 || project.icon ? (
          <SettingsGroup title="Zdjęcia">
            <SettingsCard>
              <ProjectImageGallery
                images={images}
                fallbackIcon={project.icon}
                thumbnailSize={96}
                showCountBadge
              />
            </SettingsCard>
          </SettingsGroup>
        ) : null}

        <SettingsGroup title="Informacje">
          <View style={styles.statsGrid}>
            <DetailStat icon="business-outline" label="Gmina" value={communeLabel} />
            <DetailStat icon="pricetag-outline" label="Kategoria" value={categoryLabel} />
            <DetailStat icon="location-outline" label="Lokalizacja" value={locationLine} />
            <DetailStat icon="flag-outline" label="Status" value={statusLabel} />
            <DetailStat
              icon="cash-outline"
              label="Koszt"
              value={`${project.cost.toLocaleString('pl-PL')} PLN`}
            />
            <DetailStat icon="navigate-outline" label="Mapa" value={coordinatesValue} />
            {project.createdByResidentLabel ? (
              <DetailStat icon="person-outline" label="Zgłaszający" value={project.createdByResidentLabel} />
            ) : null}
            {remainingVotes !== null ? (
              <DetailStat icon="ticket-outline" label="Pozostałe głosy" value={String(remainingVotes)} />
            ) : null}
          </View>
        </SettingsGroup>

        <SettingsGroup title="Opis projektu">
          <SettingsCard style={styles.descriptionCard}>
            <RichDescriptionPreview
              content={project.description}
              emptyPlaceholder="Brak opisu projektu."
            />
          </SettingsCard>
        </SettingsGroup>

        <VoteAnonymousToggle
          value={voteAnonymously}
          onValueChange={setVoteAnonymously}
          disabled={voting || !canVote}
        />

        {!canVote ? (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={appColors.textMuted} />
            <Text style={styles.infoText}>
              Głosowanie jest dostępne tylko dla projektów zaakceptowanych przez administratora.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={appColors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <CompactIconAction
            icon="arrow-back"
            label="Wróć"
            onPress={() => router.back()}
            accessibilityLabel="Wróć"
            variant="default"
          />
          {canEdit ? (
            <CompactIconAction
              icon="create-outline"
              label="Edytuj"
              onPress={() => router.push(`/(drawer)/edit-project/${project.id}`)}
              accessibilityLabel="Edytuj projekt"
              variant="default"
            />
          ) : null}
          {canVote ? (
            <CompactIconAction
              icon="heart"
              label={voting ? 'Głosowanie…' : 'Głosuj'}
              onPress={() => void handleVote()}
              accessibilityLabel="Głosuj na projekt"
              variant="primary"
              disabled={voting}
              loading={voting}
            />
          ) : null}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
  },
  sections: {
    gap: appTheme.spacing.lg,
  },
  heroCard: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
    ...appShadows.soft,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.md,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flex: 1,
    gap: appTheme.spacing.sm,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 148,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 14,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    gap: 4,
    ...appShadows.soft,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
    marginBottom: 2,
  },
  statLabel: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  descriptionCard: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  infoText: {
    flex: 1,
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  rejectedBody: {
    flex: 1,
    gap: 4,
  },
  rejectedTitle: {
    color: appColors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  rejectedText: {
    color: appColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  errorText: {
    flex: 1,
    color: appColors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.xs,
  },
});
