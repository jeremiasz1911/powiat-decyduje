import { Box, Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
    ensureAnonymousAuth,
    getInstallationId,
    getProjectById,
    voteForProject,
    type ProjectItem,
} from '@/src/services';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

export default function ProjectDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = params.id ?? '';
  const { notify } = useAppFeedback();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setError('Brak identyfikatora projektu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac projektu.';
      setError(message);
      await notify('Blad projektu', message, 'error');
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
      const result = await voteForProject(project.id, user.uid, installationId);

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
          const message = 'Wykorzystales limit 5 glosow.';
          setError(message);
          await notify('Limit glosow', message, 'error');
        } else {
          const message = 'Juz oddales glos na ten projekt.';
          setError(message);
          await notify('Duplikat glosu', message, 'error');
        }
      } else {
        await notify('Dziekujemy', 'Twoj glos zostal zapisany.', 'success');
      }

      setRemainingVotes(result.remainingVotes);
    } catch (voteError) {
      const message = voteError instanceof Error ? voteError.message : 'Nie udalo sie oddac glosu.';
      setError(message);
      await notify('Blad glosowania', message, 'error');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Laduje szczegoly projektu..." />;
  }

  if (!project) {
    return (
      <Box flex={1} bg={futuristicTheme.colors.bgTop} p="$4" justifyContent="center">
        <ErrorState
          message={error ?? 'Projekt nie istnieje.'}
          actionLabel="Sprobuj ponownie"
          onActionPress={() => void loadProject()}
        />
      </Box>
    );
  }

  return (
    <AppScreen gradientColors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]}>
      <Box flex={1}>
        <ScrollView contentContainerStyle={styles.content}>
          <VStack space="md">
          {project.imageUrl ? (
            <Animated.View entering={FadeInDown.duration(250)}>
              <Image source={{ uri: project.imageUrl }} style={styles.heroImage} resizeMode="cover" />
            </Animated.View>
          ) : null}

          <Heading size="xl" color={futuristicTheme.colors.textPrimary}>{project.title}</Heading>
          <Text color={futuristicTheme.colors.textMuted}>{project.description}</Text>

          <Box style={styles.metaCard}>
            <VStack space="xs">
              <Text color={futuristicTheme.colors.textMuted}>Kategoria: {project.category}</Text>
              <Text color={futuristicTheme.colors.textMuted}>
                Lokalizacja: {project.commune}, {project.village}
              </Text>
              {project.locationLabel ? (
                <Text color={futuristicTheme.colors.textMuted}>Miejsce: {project.locationLabel}</Text>
              ) : null}
              <Text color={futuristicTheme.colors.textMuted}>
                Koordynaty: {project.location.latitude.toFixed(5)}, {project.location.longitude.toFixed(5)}
              </Text>
              <Text color={futuristicTheme.colors.textMuted}>Koszt: {project.cost.toLocaleString('pl-PL')} PLN</Text>
              <Text color={futuristicTheme.colors.accent} style={styles.votes}>
                Glosy: {project.votesCount}
              </Text>
              {remainingVotes !== null ? (
                <Text color={futuristicTheme.colors.textMuted}>Pozostale glosy: {remainingVotes}</Text>
              ) : null}
            </VStack>
          </Box>

          <Button onPress={handleVote} isDisabled={voting} style={styles.primaryButton}>
            <ButtonText color={futuristicTheme.colors.textDark}>{voting ? 'Glosowanie...' : 'Głosuj'}</ButtonText>
          </Button>

          {error ? <Text color={futuristicTheme.colors.warning}>{error}</Text> : null}
          </VStack>
        </ScrollView>
      </Box>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    marginBottom: 6,
  },
  metaCard: {
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 16,
    padding: 14,
    ...futuristicShadows.soft,
  },
  votes: {
    fontWeight: '700',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 14,
    ...futuristicShadows.glow,
  },
});
