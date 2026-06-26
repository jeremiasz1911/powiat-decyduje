import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ScreenContainer } from '@/src/components/screen-container';
import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { ProjectCard } from '@/src/features/projects/components/project-card';
import { ProjectFiltersPanel } from '@/src/features/projects/components/project-filters-panel';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { listProjects, type ProjectItem } from '@/src/services';
import { appTheme } from '@/src/theme/app-theme';

export default function ProjectsScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
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
      router.push(`/(drawer)/project/${projectId}`);
    },
    [router]
  );

  const listFooter =
    filteredBySearch.length === 0
      ? undefined
      : `Wyswietlam ${filteredBySearch.length} ${filteredBySearch.length === 1 ? 'projekt' : 'projektow'}.`;

  return (
    <ScreenContainer
      title="Projekty"
      description="Przegladaj i wspieraj inicjatywy obywatelskie powiatu mlawskiego.">
      <View style={styles.sections}>
        <ProjectFiltersPanel
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
            title="Brak projektow"
            description="Sprobuj zmienic filtry lub wyszukiwanie."
            actionLabel="Wyczysc filtry"
            onActionPress={handleClearFilters}
          />
        ) : null}

        {!loading && filteredBySearch.length > 0 ? (
          <SettingsGroup title="Lista projektow" footer={listFooter}>
            <View style={styles.projectList}>
              {filteredBySearch.map((project) => (
                <ProjectCard key={project.id} project={project} onOpenDetails={handleOpenDetails} />
              ))}
            </View>
          </SettingsGroup>
        ) : null}

        {hasMore ? (
          <SettingsGroup>
            <SettingsCard>
              <SettingsRow
                label={loadingMore ? 'Ladowanie...' : 'Pokaz wiecej'}
                icon="chevron-down-circle-outline"
                onPress={() => void fetchProjects(false, cursor)}
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
  projectList: {
    gap: appTheme.spacing.md,
  },
});
