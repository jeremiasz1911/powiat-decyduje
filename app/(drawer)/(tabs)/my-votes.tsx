import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ScreenContainer } from '@/src/components/screen-container';
import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { VoteProjectRow } from '@/src/features/votes/components/vote-project-row';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  ensureAnonymousAuth,
  getInstallationId,
  getVotesSummary,
  listProjects,
  listProjectsVotedByUser,
  type ProjectItem,
  voteForProject,
} from '@/src/services';
import { appTheme } from '@/src/theme/app-theme';

export default function MyVotesScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [votesRemaining, setVotesRemaining] = useState<number | null>(null);
  const [votingProjectId, setVotingProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refreshVotesMeta = useCallback(async (uid: string) => {
    const summary = await getVotesSummary(uid);
    setVotesRemaining(summary.votesRemaining);
  }, []);

  const fetchProjects = useCallback(
    async (
      reset: boolean,
      currentCursor: QueryDocumentSnapshot<DocumentData> | null = null,
      baseItems: ProjectItem[] = []
    ) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const result = await listProjects({
          pageSize: 8,
          cursor: reset ? null : currentCursor,
        });

        setCursor(result.nextCursor);
        const nextItems = reset ? result.items : [...baseItems, ...result.items];
        setItems(nextItems);

        if (userId) {
          const voted = await listProjectsVotedByUser(userId, nextItems);
          setVotedIds(voted);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac projektow.';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await ensureAnonymousAuth();
        setUserId(user.uid);
        await refreshVotesMeta(user.uid);
      } catch (bootstrapError) {
        const message = bootstrapError instanceof Error ? bootstrapError.message : 'Nie udalo sie zaladowac glosowania.';
        setError(message);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [refreshVotesMeta]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void fetchProjects(true, null, []);
  }, [fetchProjects, userId]);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((project) =>
      [project.title, project.description, project.village].some((field) => field.toLowerCase().includes(normalized))
    );
  }, [items, search]);

  const votedProjects = useMemo(
    () => filteredItems.filter((project) => votedIds.includes(project.id)),
    [filteredItems, votedIds]
  );

  const availableProjects = useMemo(
    () => filteredItems.filter((project) => !votedIds.includes(project.id)),
    [filteredItems, votedIds]
  );

  const handleVote = async (project: ProjectItem) => {
    if (!userId) {
      return;
    }

    setVotingProjectId(project.id);

    try {
      const installationId = await getInstallationId();
      const result = await voteForProject(project.id, userId, installationId);

      setItems((prev) =>
        prev.map((item) => (item.id === project.id ? { ...item, votesCount: result.votesCount } : item))
      );

      setVotesRemaining(result.remainingVotes);

      if (result.added) {
        setVotedIds((prev) => (prev.includes(project.id) ? prev : [...prev, project.id]));
        await notify('Glos zapisany', 'Oddales glos na projekt.', 'success');
      } else if (result.reason === 'vote_limit_reached') {
        await notify('Limit glosow', 'Wykorzystales limit 5 glosow.', 'error');
      } else {
        await notify('Duplikat', 'Juz glosowales na ten projekt.', 'error');
      }
    } catch (voteError) {
      const message = voteError instanceof Error ? voteError.message : 'Nie udalo sie oddac glosu.';
      await notify('Blad glosowania', message, 'error');
    } finally {
      setVotingProjectId(null);
    }
  };

  const openProject = (projectId: string) => {
    router.push(`/(drawer)/project/${projectId}`);
  };

  const hasMore = Boolean(cursor);
  const voteDisabled = votesRemaining === 0;

  const renderProjectRows = (projects: ProjectItem[]) =>
    projects.map((project) => {
      const alreadyVoted = votedIds.includes(project.id);
      const disabled = alreadyVoted || votingProjectId === project.id || voteDisabled;

      return (
        <VoteProjectRow
          key={project.id}
          project={project}
          alreadyVoted={alreadyVoted}
          voting={votingProjectId === project.id}
          voteDisabled={disabled}
          onOpen={() => openProject(project.id)}
          onVote={() => void handleVote(project)}
        />
      );
    });

  return (
    <ScreenContainer title="Glosy" description="Oddawaj glosy na projekty obywatelskie.">
      <View style={styles.sections}>
        <SettingsGroup
          title="Podsumowanie"
          footer="Mozesz oddac maksymalnie 5 glosow na rozne projekty.">
          <SettingsCard>
            <SettingsRow
              label="Pozostale glosy"
              icon="heart-outline"
              value={votesRemaining != null ? String(votesRemaining) : '—'}
            />
          </SettingsCard>
        </SettingsGroup>

        <SettingsGroup title="Szukaj">
          <SettingsCard style={styles.searchCard}>
            <View style={styles.searchWrap}>
              <AppTextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tytul lub opis projektu…"
                containerStyle={styles.searchInput}
                inputStyle={styles.searchField}
              />
            </View>
          </SettingsCard>
        </SettingsGroup>

        {loading ? <LoadingState label="Laduje projekty do glosowania..." /> : null}

        {error ? (
          <ErrorState
            message={error}
            actionLabel="Sprobuj ponownie"
            onActionPress={() => void fetchProjects(true, null, [])}
          />
        ) : null}

        {!loading && !error && filteredItems.length === 0 ? (
          <EmptyState
            title="Brak projektow"
            description="Sprobuj zmienic fraze wyszukiwania."
            actionLabel="Wyczysc"
            onActionPress={() => setSearch('')}
          />
        ) : null}

        {!loading && votedProjects.length > 0 ? (
          <SettingsGroup title="Oddane glosy" footer={`${votedProjects.length} projektow z Twoim glosem.`}>
            <SettingsCard>{renderProjectRows(votedProjects)}</SettingsCard>
          </SettingsGroup>
        ) : null}

        {!loading && availableProjects.length > 0 ? (
          <SettingsGroup
            title="Dostepne projekty"
            footer={voteDisabled ? 'Wykorzystales limit glosow.' : 'Wybierz projekt i oddaj glos.'}>
            <SettingsCard>{renderProjectRows(availableProjects)}</SettingsCard>
          </SettingsGroup>
        ) : null}

        {hasMore ? (
          <SettingsGroup>
            <SettingsCard>
              <SettingsRow
                label={loadingMore ? 'Ladowanie...' : 'Pokaz wiecej'}
                icon="add-circle-outline"
                onPress={() => void fetchProjects(false, cursor, items)}
                disabled={loadingMore}
                loading={loadingMore}
                showChevron={!loadingMore}
              />
            </SettingsCard>
          </SettingsGroup>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: appTheme.spacing.lg,
  },
  searchCard: {
    paddingVertical: appTheme.spacing.sm,
  },
  searchWrap: {
    paddingHorizontal: appTheme.spacing.md,
  },
  searchInput: {
    gap: 0,
  },
  searchField: {
    minHeight: 40,
    borderRadius: 10,
    fontSize: 15,
    paddingHorizontal: appTheme.spacing.md,
  },
});
