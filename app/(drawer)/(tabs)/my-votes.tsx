import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { Box, Button, ButtonText, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ProjectCard } from '@/src/features/projects/components/project-card';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  ensureAnonymousAuth,
  getInstallationId,
  getVotedProjectIds,
  getVotesSummary,
  listProjects,
  type ProjectItem,
  voteForProject,
} from '@/src/services';

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
    const [summary, ids] = await Promise.all([getVotesSummary(uid), getVotedProjectIds(uid)]);
    setVotesRemaining(summary.votesRemaining);
    setVotedIds(ids);
  }, []);

  const fetchProjects = useCallback(
    async (reset: boolean, currentCursor: QueryDocumentSnapshot<DocumentData> | null = null) => {
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
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac projektow.';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await ensureAnonymousAuth();
        setUserId(user.uid);
        await refreshVotesMeta(user.uid);
        await fetchProjects(true, null);
      } catch (bootstrapError) {
        const message = bootstrapError instanceof Error ? bootstrapError.message : 'Nie udalo sie zaladowac glosowania.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [fetchProjects, refreshVotesMeta]);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((project) =>
      [project.title, project.description, project.village].some((field) => field.toLowerCase().includes(normalized))
    );
  }, [items, search]);

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

  const hasMore = Boolean(cursor);

  return (
    <Box flex={1} bg="$backgroundLight0">
      <ScrollView contentContainerStyle={styles.content}>
        <VStack space="md">
          <Heading size="lg">My Votes</Heading>
          <Text color="$textLight600">Szukaj projektow i glosuj bezposrednio z tej zakladki.</Text>
          <Text color="$textLight700">Pozostale glosy: {votesRemaining ?? '-'}</Text>

          <Input>
            <InputField
              placeholder="Szukaj po tytule, opisie lub miejscowosci..."
              value={search}
              onChangeText={setSearch}
            />
          </Input>

          {loading ? <LoadingState label="Laduje projekty do glosowania..." /> : null}

          {error ? (
            <ErrorState
              message={error}
              actionLabel="Sprobuj ponownie"
              onActionPress={() => void fetchProjects(true, null)}
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

          {filteredItems.map((project, index) => {
            const alreadyVoted = votedIds.includes(project.id);
            const disabled = alreadyVoted || votingProjectId === project.id || votesRemaining === 0;

            return (
              <Animated.View key={project.id} entering={FadeInDown.delay(index * 35).duration(230)}>
                <VStack space="sm">
                  <ProjectCard project={project} onOpenDetails={(projectId) => router.push(`/(drawer)/project/${projectId}`)} />
                  <Button
                    size="sm"
                    action={alreadyVoted ? 'secondary' : 'primary'}
                    variant={alreadyVoted ? 'outline' : 'solid'}
                    isDisabled={disabled}
                    onPress={() => void handleVote(project)}>
                    <ButtonText>
                      {alreadyVoted
                        ? 'Juz zaglosowano'
                        : votingProjectId === project.id
                          ? 'Glosowanie...'
                          : 'Glosuj na projekt'}
                    </ButtonText>
                  </Button>
                </VStack>
              </Animated.View>
            );
          })}

          {hasMore ? (
            <Button onPress={() => void fetchProjects(false, cursor)} isDisabled={loadingMore}>
              <ButtonText>{loadingMore ? 'Ladowanie...' : 'Pokaz wiecej'}</ButtonText>
            </Button>
          ) : null}
        </VStack>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 36,
  },
});
