import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { SettingsGroup } from '@/src/components/settings/settings-ui';
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
  getInstallationId,
  getProjectById,
  requireSignedInUser,
  voteForProject,
  type ProjectItem,
} from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useRequireAuth } from '@/src/store/login-required-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type DetailStatProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

function DetailStat({ icon, label, value }: DetailStatProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={15} color={colors.primary} />
      </View>
      <View style={styles.statBody}>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={3}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProjectDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = params.id ?? '';
  const { notify } = useAppFeedback();
  const { colors } = useAppTheme();
  const { user, canAccessPrivateFeatures } = useAuthContext();
  const { requireAuth } = useRequireAuth();

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
      const userId = canAccessPrivateFeatures ? user?.uid ?? null : null;
      if (canAccessPrivateFeatures) {
        const signedInUser = await requireSignedInUser();
        setCurrentUserId(signedInUser.uid);
        const data = await getProjectById(projectId, { userId: signedInUser.uid });
        setProject(data);
      } else {
        setCurrentUserId(null);
        const data = await getProjectById(projectId, { userId: null });
        setProject(data);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Nie udało się pobrać projektu.';
      setError(message);
      await notify('Błąd projektu', message, 'error');
    } finally {
      setLoading(false);
    }
  }, [canAccessPrivateFeatures, notify, projectId, user?.uid]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const submitVote = async () => {
    if (!project) {
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const signedInUser = await requireSignedInUser();
      const installationId = await getInstallationId();
      const result = await voteForProject(project.id, signedInUser.uid, installationId, {
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

  const handleVote = () => {
    requireAuth(() => {
      void submitVote();
    });
  };

  if (loading) {
    return (
      <AppScreen cherryBackground edges={[]}>
        <LoadingState label="Ładuję szczegóły projektu..." />
      </AppScreen>
    );
  }

  if (!project) {
    return (
      <AppScreen cherryBackground edges={[]}>
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
    <AppScreen cherryBackground scroll edges={[]} contentContainerStyle={styles.content}>
      <View style={styles.sections}>
        <View style={styles.heroSection}>
          <View style={styles.heroRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: `${markerColor}22` }]}>
              <Ionicons name={resolveProjectIcon(project.icon)} size={26} color={markerColor} />
            </View>
            <View style={styles.heroBody}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{project.title}</Text>
              <View style={styles.heroMeta}>
                <ProjectStatusBadge status={project.status} />
                <ProjectVotesCount count={project.votesCount} variant="chip" />
              </View>
            </View>
          </View>
        </View>

        {normalizedStatus === 'submitted' && isOwner ? (
          <View style={[styles.infoBox, { borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Projekt oczekuje na weryfikację. Po zaakceptowaniu przez administratora będzie widoczny
              publicznie na liście projektów i mapie.
            </Text>
          </View>
        ) : null}

        {normalizedStatus === 'rejected' ? (
          <View style={[styles.rejectedBox, { borderColor: colors.danger }]}>
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <View style={styles.rejectedBody}>
              <Text style={[styles.rejectedTitle, { color: colors.danger }]}>Projekt został odrzucony</Text>
              <Text style={[styles.rejectedText, { color: colors.textSecondary }]}>
                {project.rejectionReason?.trim() ||
                  'Projekt nie został zaakceptowany i nie jest widoczny publicznie.'}
              </Text>
            </View>
          </View>
        ) : null}

        {images.length > 0 || project.icon ? (
          <SettingsGroup title="Zdjęcia">
            <ProjectImageGallery
              images={images}
              fallbackIcon={project.icon}
              thumbnailSize={96}
              showCountBadge
            />
          </SettingsGroup>
        ) : null}

        <SettingsGroup title="Informacje">
          <View style={styles.statsList}>
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
          <RichDescriptionPreview
            content={project.description}
            emptyPlaceholder="Brak opisu projektu."
          />
        </SettingsGroup>

        <SettingsGroup title="Głosowanie">
          <View style={styles.voteSection}>
            {canAccessPrivateFeatures ? (
              <VoteAnonymousToggle
                value={voteAnonymously}
                onValueChange={setVoteAnonymously}
                disabled={voting || !canVote}
              />
            ) : canVote ? (
              <View style={[styles.infoBox, styles.infoBoxInset, { borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Aby oddać głos, musisz się zalogować.
                </Text>
              </View>
            ) : null}

            {!canVote ? (
              <View style={[styles.infoBox, styles.infoBoxInset, { borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Głosowanie jest dostępne tylko dla projektów zaakceptowanych przez administratora.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.errorBox, styles.infoBoxInset]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
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
                  label={voting ? 'Głosowanie…' : 'Oddaj głos'}
                  onPress={handleVote}
                  accessibilityLabel="Oddaj głos na projekt"
                  variant="primary"
                  disabled={voting}
                  loading={voting}
                />
              ) : null}
            </View>
          </View>
        </SettingsGroup>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.xl,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
  },
  sections: {
    gap: appTheme.spacing.lg,
  },
  heroSection: {
    gap: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.sm,
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
  statsList: {
    gap: 0,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statBody: {
    flex: 1,
    gap: 2,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  voteSection: {
    gap: appTheme.spacing.md,
  },
  infoBoxInset: {
    marginTop: appTheme.spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: appTheme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: appTheme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectedBody: {
    flex: 1,
    gap: 4,
  },
  rejectedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  rejectedText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: appTheme.spacing.sm,
  },
  errorText: {
    flex: 1,
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
