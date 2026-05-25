import { Box, Button, ButtonText, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ProjectCard } from '@/src/features/projects/components/project-card';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { ensureAnonymousAuth, listMyProjects, type ProjectItem } from '@/src/services';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';
import { AppScreen } from '@/src/components/layout/app-screen';

export default function DrawerMyProjectsScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const fetchProjects = useCallback(
    async (reset: boolean, currentCursor: QueryDocumentSnapshot<DocumentData> | null = null) => {
      if (!userId) {
        return;
      }

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const result = await listMyProjects(userId, {
          pageSize: 8,
          cursor: reset ? null : currentCursor,
        });

        setCursor(result.nextCursor);
        setItems((prev) => (reset ? result.items : [...prev, ...result.items]));
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac Twoich projektow.';
        setError(message);
        await notify('Blad', message, 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [notify, userId]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await ensureAnonymousAuth();
        setUserId(user.uid);
      } catch (bootstrapError) {
        const message = bootstrapError instanceof Error ? bootstrapError.message : 'Nie udalo sie zalogowac.';
        setError(message);
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void fetchProjects(true, null);
  }, [fetchProjects, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }

      void fetchProjects(true, null);
    }, [fetchProjects, userId])
  );

  const hasMore = Boolean(cursor);
  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((project) =>
      [project.title, project.description, project.village].some((field) => field.toLowerCase().includes(normalized))
    );
  }, [items, search]);

  return (
    <AppScreen gradientColors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]}>
      <Box flex={1}>
        <ScrollView contentContainerStyle={styles.content}>
          <VStack space="md">
            <Heading size="lg" color={futuristicTheme.colors.textPrimary}>Moje projekty</Heading>
            <Text color={futuristicTheme.colors.textMuted}>Twoje zgloszenia z wyszukiwaniem, podgladem i edycja.</Text>

            <Input style={styles.input}>
              <InputField
                placeholder="Szukaj po tytule, opisie lub miejscowosci..."
                value={search}
                onChangeText={setSearch}
                color={futuristicTheme.colors.textPrimary}
                placeholderTextColor={futuristicTheme.colors.textMuted}
              />
            </Input>

            <Button
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: '/(drawer)/submit-project',
                  params: { latitude: '53.1126', longitude: '20.3843' },
                })
              }>
              <ButtonText color={futuristicTheme.colors.textDark}>Zloz nowy projekt</ButtonText>
            </Button>

            <Button action="secondary" variant="outline" style={styles.ghostButton} onPress={() => void fetchProjects(true, null)}>
              <ButtonText color={futuristicTheme.colors.textPrimary}>Odswiez liste</ButtonText>
            </Button>

            {loading ? <LoadingState label="Laduje projekty..." /> : null}

            {error ? (
              <ErrorState
                message={error}
                actionLabel="Sprobuj ponownie"
                onActionPress={() => void fetchProjects(true, null)}
              />
            ) : null}

            {!loading && !error && filteredItems.length === 0 ? (
              <EmptyState
                title="Brak Twoich projektow"
                description="Dodaj pierwszy projekt, aby miec go na tej liscie."
                actionLabel="Przejdz do formularza"
                onActionPress={() =>
                  router.push({
                    pathname: '/(drawer)/submit-project',
                    params: { latitude: '53.1126', longitude: '20.3843' },
                  })
                }
              />
            ) : null}

            {filteredItems.map((project, index) => (
              <Animated.View key={project.id} entering={FadeInDown.delay(index * 35).duration(240)}>
                <VStack space="sm">
                  <ProjectCard
                    project={project}
                    onOpenDetails={(projectId) => router.push(`/(drawer)/project/${projectId}`)}
                  />
                  <Button
                    size="sm"
                    action="secondary"
                    variant="outline"
                    style={styles.ghostButton}
                    onPress={() => router.push(`/(drawer)/edit-project/${project.id}`)}>
                    <ButtonText color={futuristicTheme.colors.textPrimary}>Edytuj projekt</ButtonText>
                  </Button>
                </VStack>
              </Animated.View>
            ))}

            {hasMore ? (
              <Button onPress={() => fetchProjects(false, cursor)} isDisabled={loadingMore} style={styles.ghostButton}>
                <ButtonText color={futuristicTheme.colors.textPrimary}>{loadingMore ? 'Ladowanie...' : 'Pokaz wiecej'}</ButtonText>
              </Button>
            ) : null}
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
  input: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 14,
  },
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 14,
    ...futuristicShadows.glow,
  },
  ghostButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderWidth: 1,
  },
});
