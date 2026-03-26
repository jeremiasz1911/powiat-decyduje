import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
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

import { listProjects, type ProjectItem } from '@/src/services';

const CATEGORIES = ['Infrastruktura', 'Edukacja', 'Sport', 'Ekologia', 'Kultura'] as const;
const COMMUNES = ['Mlawa', 'Lipowiec Koscielny', 'Szydlowo', 'Wieczfnia Koscielna'] as const;

export default function ProjectsScreen() {
  const router = useRouter();
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
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, selectedCommune]
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

  return (
    <Box flex={1} bg="$backgroundLight0">
      <ScrollView contentContainerStyle={styles.content}>
        <VStack space="md">
          <Heading size="lg">Projects</Heading>
          <Text color="$textLight600">Lista projektow z wyszukiwaniem i filtrami.</Text>

          <Input>
            <InputField
              placeholder="Szukaj po tytule, opisie lub miejscowosci..."
              value={search}
              onChangeText={setSearch}
            />
          </Input>

          <VStack space="xs">
            <Text>Kategoria</Text>
            <View style={styles.filterWrap}>
              <Button
                size="sm"
                variant={selectedCategory ? 'outline' : 'solid'}
                action={selectedCategory ? 'secondary' : 'primary'}
                borderRadius="$full"
                onPress={() => setSelectedCategory('')}>
                <ButtonText>Wszystkie</ButtonText>
              </Button>
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? 'solid' : 'outline'}
                  action={selectedCategory === category ? 'primary' : 'secondary'}
                  borderRadius="$full"
                  onPress={() => setSelectedCategory(category)}>
                  <ButtonText>{category}</ButtonText>
                </Button>
              ))}
            </View>
          </VStack>

          <VStack space="xs">
            <Text>Gmina</Text>
            <View style={styles.filterWrap}>
              <Button
                size="sm"
                variant={selectedCommune ? 'outline' : 'solid'}
                action={selectedCommune ? 'secondary' : 'primary'}
                borderRadius="$full"
                onPress={() => setSelectedCommune('')}>
                <ButtonText>Wszystkie</ButtonText>
              </Button>
              {COMMUNES.map((commune) => (
                <Button
                  key={commune}
                  size="sm"
                  variant={selectedCommune === commune ? 'solid' : 'outline'}
                  action={selectedCommune === commune ? 'primary' : 'secondary'}
                  borderRadius="$full"
                  onPress={() => setSelectedCommune(commune)}>
                  <ButtonText>{commune}</ButtonText>
                </Button>
              ))}
            </View>
          </VStack>

          <Button onPress={onApplyFilters}>
            <ButtonText>Zastosuj filtry</ButtonText>
          </Button>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : null}

          {error ? <Text color="$error600">{error}</Text> : null}

          {!loading && filteredBySearch.length === 0 && !error ? (
            <Text color="$textLight600">Brak projektow dla wybranych kryteriow.</Text>
          ) : null}

          {filteredBySearch.map((project) => (
            <Box key={project.id} style={styles.card} borderRadius="$xl" bg="$backgroundLight50" p="$3">
              {project.imageUrl ? (
                <Image source={{ uri: project.imageUrl }} style={styles.cardImage} resizeMode="cover" />
              ) : null}
              <VStack space="xs">
                <Heading size="sm">{project.title}</Heading>
                <Text color="$textLight700">{project.description}</Text>
                <Text color="$textLight600">
                  {project.category} • {project.commune} • {project.village}
                </Text>
                <Text color="$textLight600">Koszt: {project.cost.toLocaleString('pl-PL')} PLN</Text>
                <Text color="$textLight800">Glosy: {project.votesCount}</Text>
                <Button
                  size="sm"
                  variant="outline"
                  action="secondary"
                  onPress={() => router.push(`/(drawer)/project/${project.id}`)}>
                  <ButtonText>Zobacz szczegoly</ButtonText>
                </Button>
              </VStack>
            </Box>
          ))}

          {hasMore ? (
            <Button onPress={() => fetchProjects(false, cursor)} isDisabled={loadingMore}>
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
    paddingBottom: 30,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
