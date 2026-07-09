import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ScreenContainer } from '@/src/components/screen-container';
import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { MyProjectRow } from '@/src/features/projects/components/my-project-row';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { usePrivateRoute } from '@/src/hooks/use-private-route';
import { listMyProjects, type ProjectItem } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { appTheme } from '@/src/theme/app-theme';

const DEFAULT_MAP_COORDS = {
  latitude: '53.1126',
  longitude: '20.3843',
};

export default function DrawerMyProjectsScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const canAccessPrivateFeatures = usePrivateRoute();
  const { user } = useAuthContext();
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const userId = user?.uid ?? null;

  const openSubmitProject = useCallback(() => {
    router.push({
      pathname: '/(drawer)/submit-project',
      params: DEFAULT_MAP_COORDS,
    });
  }, [router]);

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
        const message = loadError instanceof Error ? loadError.message : 'Nie udało się pobrać Twoich projektów.';
        setError(message);
        await notify('Błąd', message, 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [notify, userId]
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('Zaloguj się, aby zobaczyć swoje projekty.');
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
      [project.title, project.description, project.village, project.locationLabel, project.category]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalized))
    );
  }, [items, search]);

  const openProject = (projectId: string) => {
    router.push(`/(drawer)/(tabs)/project/${projectId}`);
  };

  const editProject = (projectId: string) => {
    router.push(`/(drawer)/edit-project/${projectId}`);
  };

  const showEmptySearch = !loading && !error && items.length > 0 && filteredItems.length === 0;
  const showEmptyList = !loading && !error && items.length === 0;

  if (!canAccessPrivateFeatures) {
    return null;
  }

  return (
    <ScreenContainer
      title="Moje projekty"
      description="Twoje inicjatywy — również te oczekujące na akceptację.">
      <View style={styles.sections}>
        <AppButton title="Zgłoś nowy projekt" onPress={openSubmitProject} />

        <SettingsGroup title="Szukaj">
          <AppTextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tytuł, opis, miejscowość…"
            variant="minimal"
          />
        </SettingsGroup>

        {loading ? <LoadingState label="Ładuję Twoje projekty..." /> : null}

        {error ? (
          <ErrorState
            message={error}
            actionLabel="Spróbuj ponownie"
            onActionPress={() => void fetchProjects(true, null)}
          />
        ) : null}

        {showEmptyList ? (
          <EmptyState
            title="Brak Twoich projektów"
            description="Zgłoś pierwszą inicjatywę obywatelską, aby śledzić jej status w tym miejscu."
            actionLabel="Zgłoś projekt"
            onActionPress={openSubmitProject}
          />
        ) : null}

        {showEmptySearch ? (
          <EmptyState
            title="Brak wyników"
            description="Nie znaleziono projektów pasujących do podanej frazy."
            actionLabel="Wyczyść wyszukiwanie"
            onActionPress={() => setSearch('')}
          />
        ) : null}

        {!loading && !error && filteredItems.length > 0 ? (
          <SettingsGroup
            title="Twoje projekty"
            footer={`${filteredItems.length} ${filteredItems.length === 1 ? 'projekt' : 'projektów'} na liście.`}>
            <SettingsCard>
              {filteredItems.map((project) => (
                <MyProjectRow
                  key={project.id}
                  project={project}
                  onOpen={() => openProject(project.id)}
                  onEdit={() => editProject(project.id)}
                />
              ))}
            </SettingsCard>
          </SettingsGroup>
        ) : null}

        {hasMore ? (
          <SettingsRow
            label={loadingMore ? 'Ładowanie...' : 'Pokaż więcej'}
            icon="chevron-down-circle-outline"
            onPress={() => void fetchProjects(false, cursor)}
            disabled={loadingMore}
            loading={loadingMore}
            showChevron={!loadingMore}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: appTheme.spacing.lg,
  },
});
