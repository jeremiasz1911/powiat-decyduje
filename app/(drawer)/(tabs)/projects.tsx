import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ScreenContainer } from '@/src/components/screen-container';
import { ProjectCard } from '@/src/features/projects/components/project-card';
import { ProjectFiltersPanel } from '@/src/features/projects/components/project-filters-panel';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { listProjects, type ProjectItem } from '@/src/services';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

export default function ProjectsScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
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
      [project.title, project.description].some((field) => field.toLowerCase().includes(normalized))
    );
  }, [projects, search]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedCommune('');
    setSearch('');
  };

  const hasMore = Boolean(cursor);

  const handleOpenDetails = useCallback(
    (projectId: string) => {
      router.push(`/(drawer)/(tabs)/project/${projectId}`);
    },
    [router]
  );

  return (
    <ScreenContainer
      title="Projekty"
      description="Przegladaj inicjatywy obywatelskie powiatu mlawskiego.">
      <View style={styles.sections}>
        <ProjectFiltersPanel
          variant="minimal"
          search={search}
          selectedCategory={selectedCategory}
          selectedCommune={selectedCommune}
          onSearchChange={setSearch}
          onCategoryChange={setSelectedCategory}
          onCommuneChange={setSelectedCommune}
          onClearFilters={handleClearFilters}
          resultsCount={filteredBySearch.length}
        />

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
            title="Brak zaakceptowanych projektów"
            description="Na liście publicznej widać tylko projekty zaakceptowane przez administratora."
            actionLabel="Wyczysc filtry"
            onActionPress={handleClearFilters}
          />
        ) : null}

        {!loading && filteredBySearch.length > 0 ? (
          <View style={styles.listSection}>
            <Text style={[styles.listTitle, { color: colors.textPrimary }]}>Lista projektów</Text>
            <Text style={[styles.listMeta, { color: colors.textMuted }]}>
              Wyświetlam {filteredBySearch.length}{' '}
              {filteredBySearch.length === 1 ? 'projekt' : 'projektów'}
            </Text>
            <View style={styles.projectList}>
              {filteredBySearch.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant="flat"
                  onOpenDetails={handleOpenDetails}
                />
              ))}
            </View>
          </View>
        ) : null}

        {hasMore ? (
          <Pressable
            onPress={() => void fetchProjects(false, cursor)}
            disabled={loadingMore}
            style={({ pressed }) => [
              styles.loadMore,
              { borderColor: colors.border, opacity: pressed || loadingMore ? 0.7 : 1 },
            ]}>
            <Text style={[styles.loadMoreText, { color: colors.primary }]}>
              {loadingMore ? 'Ładowanie…' : 'Pokaż więcej'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: appTheme.spacing.xl,
  },
  listSection: {
    gap: appTheme.spacing.md,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  listMeta: {
    fontSize: 13,
    marginTop: -appTheme.spacing.xs,
  },
  projectList: {
    gap: appTheme.spacing.lg,
  },
  loadMore: {
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.sm,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
