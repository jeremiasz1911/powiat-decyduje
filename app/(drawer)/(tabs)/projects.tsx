import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Box,
  Button,
  ButtonText,
  Heading,
  Input,
  InputField,
  Text,
  VStack,
} from '@gluestack-ui/themed';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ProjectCard } from '@/src/features/projects/components/project-card';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { listProjects, type ProjectItem } from '@/src/services';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

const CATEGORIES = ['Infrastruktura', 'Edukacja', 'Sport', 'Ekologia', 'Kultura', 'Inne'] as const;
const COMMUNES = ['Mlawa', 'Lipowiec Koscielny', 'Szydlowo', 'Wieczfnia Koscielna'] as const;

export default function ProjectsScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          commune: selectedCommune || undefined,
          category: selectedCategory || undefined,
          pageSize: 8,
          cursor: reset ? null : currentCursor,
        });

        setCursor(result.nextCursor);
        setProjects((prev) => (reset ? result.items : [...prev, ...result.items]));
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac projektow.';
        setError(message);
        await notify('Blad listy projektow', message, 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [notify, selectedCategory, selectedCommune]
  );

  useEffect(() => {
    void fetchProjects(true, null);
  }, [fetchProjects]);

  const filteredBySearch = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return projects;
    }

    return projects.filter((project) =>
      [project.title, project.description, project.village].some((field) =>
        field.toLowerCase().includes(normalized)
      )
    );
  }, [projects, search]);

  const onApplyFilters = async () => {
    setCursor(null);
    await fetchProjects(true, null);
  };

  const hasMore = Boolean(cursor);
  const handleOpenDetails = useCallback(
    (projectId: string) => {
      void notify('Projekt', 'Otwieram szczegoly projektu.', 'info');
      router.push(`/(drawer)/project/${projectId}`);
    },
    [notify, router]
  );

  return (
    <LinearGradient colors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]} style={styles.gradient}>
      <Box flex={1}>
        <ScrollView contentContainerStyle={styles.content}>
          <VStack space="md">
            <Heading size="lg" color={futuristicTheme.colors.textPrimary}>Projects</Heading>
            <Text color={futuristicTheme.colors.textMuted}>Lista projektow z wyszukiwaniem i filtrami.</Text>

            <Input style={styles.input}>
              <InputField
                placeholder="Szukaj po tytule, opisie lub miejscowosci..."
                value={search}
                onChangeText={setSearch}
                color={futuristicTheme.colors.textPrimary}
                placeholderTextColor={futuristicTheme.colors.textMuted}
              />
            </Input>

            <VStack space="xs">
              <Text color={futuristicTheme.colors.textPrimary}>Kategoria</Text>
              <View style={styles.filterWrap}>
                <Button
                  size="sm"
                  variant={selectedCategory ? 'outline' : 'solid'}
                  action={selectedCategory ? 'secondary' : 'primary'}
                  borderRadius="$full"
                  style={styles.filterButton}
                  onPress={() => setSelectedCategory('')}>
                  <ButtonText color={futuristicTheme.colors.textPrimary}>Wszystkie</ButtonText>
                </Button>
                {CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? 'solid' : 'outline'}
                    action={selectedCategory === category ? 'primary' : 'secondary'}
                    borderRadius="$full"
                    style={styles.filterButton}
                    onPress={() => setSelectedCategory(category)}>
                    <ButtonText color={futuristicTheme.colors.textPrimary}>{category}</ButtonText>
                  </Button>
                ))}
              </View>
            </VStack>

            <VStack space="xs">
              <Text color={futuristicTheme.colors.textPrimary}>Gmina</Text>
              <View style={styles.filterWrap}>
                <Button
                  size="sm"
                  variant={selectedCommune ? 'outline' : 'solid'}
                  action={selectedCommune ? 'secondary' : 'primary'}
                  borderRadius="$full"
                  style={styles.filterButton}
                  onPress={() => setSelectedCommune('')}>
                  <ButtonText color={futuristicTheme.colors.textPrimary}>Wszystkie</ButtonText>
                </Button>
                {COMMUNES.map((commune) => (
                  <Button
                    key={commune}
                    size="sm"
                    variant={selectedCommune === commune ? 'solid' : 'outline'}
                    action={selectedCommune === commune ? 'primary' : 'secondary'}
                    borderRadius="$full"
                    style={styles.filterButton}
                    onPress={() => setSelectedCommune(commune)}>
                    <ButtonText color={futuristicTheme.colors.textPrimary}>{commune}</ButtonText>
                  </Button>
                ))}
              </View>
            </VStack>

            <Button onPress={onApplyFilters} style={styles.primaryButton}>
              <ButtonText color={futuristicTheme.colors.textDark}>Zastosuj filtry</ButtonText>
            </Button>

            {loading ? <LoadingState label="Pobieram projekty..." /> : null}

            {error ? (
              <ErrorState
                message={error}
                actionLabel="Sprobuj ponownie"
                onActionPress={() => void fetchProjects(true, null)}
              />
            ) : null}

            {!loading && filteredBySearch.length === 0 && !error ? (
              <EmptyState
                title="Brak projektow"
                description="Sprobuj zmienic filtry lub wyszukiwanie."
                actionLabel="Wyczysc filtry"
                onActionPress={() => {
                  setSelectedCategory('');
                  setSelectedCommune('');
                  setSearch('');
                  void fetchProjects(true, null);
                }}
              />
            ) : null}

            {filteredBySearch.map((project, index) => (
              <Animated.View key={project.id} entering={FadeInDown.delay(index * 40).duration(260)}>
                <ProjectCard project={project} onOpenDetails={handleOpenDetails} />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  input: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 14,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
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
