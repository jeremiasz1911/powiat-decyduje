import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Box, Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';

import {
  ensureAnonymousAuth,
  getInstallationId,
  getProjectById,
  voteForProject,
  type ProjectItem,
} from '@/src/services';

export default function ProjectDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = params.id ?? '';

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setError('Brak identyfikatora projektu.');
        setLoading(false);
        return;
      }

      try {
        const data = await getProjectById(projectId);
        setProject(data);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac projektu.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

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
          setError('Wykorzystales limit 5 glosow.');
        } else {
          setError('Juz oddales glos na ten projekt.');
        }
      }

      setRemainingVotes(result.remainingVotes);
    } catch (voteError) {
      const message = voteError instanceof Error ? voteError.message : 'Nie udalo sie oddac glosu.';
      setError(message);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!project) {
    return (
      <Box flex={1} bg="$backgroundLight0" p="$4" justifyContent="center">
        <Text color="$error600">{error ?? 'Projekt nie istnieje.'}</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$backgroundLight0">
      <ScrollView contentContainerStyle={styles.content}>
        <VStack space="md">
          {project.imageUrl ? (
            <Image source={{ uri: project.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : null}

          <Heading size="xl">{project.title}</Heading>
          <Text color="$textLight700">{project.description}</Text>

          <Box style={styles.metaCard}>
            <VStack space="xs">
              <Text color="$textLight600">Kategoria: {project.category}</Text>
              <Text color="$textLight600">
                Lokalizacja: {project.commune}, {project.village}
              </Text>
              <Text color="$textLight600">
                Koordynaty: {project.location.latitude.toFixed(5)}, {project.location.longitude.toFixed(5)}
              </Text>
              <Text color="$textLight600">Koszt: {project.cost.toLocaleString('pl-PL')} PLN</Text>
              <Text color="$textLight800" style={styles.votes}>
                Glosy: {project.votesCount}
              </Text>
              {remainingVotes !== null ? (
                <Text color="$textLight700">Pozostale glosy: {remainingVotes}</Text>
              ) : null}
            </VStack>
          </Box>

          <Button onPress={handleVote} isDisabled={voting}>
            <ButtonText>{voting ? 'Glosowanie...' : 'Głosuj'}</ButtonText>
          </Button>

          {error ? <Text color="$warning700">{error}</Text> : null}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    marginBottom: 6,
  },
  metaCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
  },
  votes: {
    fontWeight: '700',
    marginTop: 4,
  },
});
