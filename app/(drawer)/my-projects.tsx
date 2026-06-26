import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { ScreenContainer } from '@/src/components/screen-container';
import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { MyProjectRow } from '@/src/features/projects/components/my-project-row';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { ensureAnonymousAuth, listMyProjects, type ProjectItem } from '@/src/services';
import { appColors, appTheme } from '@/src/theme/app-theme';

const DEFAULT_MAP_COORDS = {
  latitude: '53.1126',
  longitude: '20.3843',
};

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
      [project.title, project.description, project.village, project.locationLabel, project.category]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalized))
    );
  }, [items, search]);

  const openProject = (projectId: string) => {
    router.push(`/(drawer)/project/${projectId}`);
  };

  const editProject = (projectId: string) => {
    router.push(`/(drawer)/edit-project/${projectId}`);
  };

  const showEmptySearch = !loading && !error && items.length > 0 && filteredItems.length === 0;
  const showEmptyList = !loading && !error && items.length === 0;

  return (
    <ScreenContainer
      title="Moje projekty"
      description="Twoje zgloszenia projektow obywatelskich i ich status.">
      <View style={styles.sections}>
        <SettingsGroup title="Nowy projekt">
          <SettingsCard>
            <SettingsRow
              label="Zloz nowy projekt"
              icon="add-circle-outline"
              onPress={openSubmitProject}
            />
          </SettingsCard>
        </SettingsGroup>

        <SettingsGroup title="Szukaj">
          <SettingsCard style={styles.searchCard}>
            <View style={styles.searchWrap}>
              <AppTextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tytul, opis, miejscowosc…"
                containerStyle={styles.searchInput}
                inputStyle={styles.searchField}
              />
            </View>
          </SettingsCard>
        </SettingsGroup>

        {loading ? <LoadingState label="Laduje Twoje projekty..." /> : null}

        {error ? (
          <ErrorState
            message={error}
            actionLabel="Sprobuj ponownie"
            onActionPress={() => void fetchProjects(true, null)}
          />
        ) : null}

        {showEmptyList ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={28} color={appColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Brak Twoich projektow</Text>
            <Text style={styles.emptyDescription}>
              Zglos pierwszy projekt obywatelski, aby sledzic jego status w tym miejscu.
            </Text>
            <AppButton title="Dodaj projekt" variant="secondary" onPress={openSubmitProject} />
          </View>
        ) : null}

        {showEmptySearch ? (
          <View style={styles.emptyStateCompact}>
            <Text style={styles.emptyDescription}>Brak wynikow dla podanej frazy.</Text>
            <AppButton title="Wyczysc wyszukiwanie" variant="ghost" onPress={() => setSearch('')} />
          </View>
        ) : null}

        {!loading && !error && filteredItems.length > 0 ? (
          <SettingsGroup
            title="Twoje projekty"
            footer={`${filteredItems.length} ${filteredItems.length === 1 ? 'projekt' : 'projektow'} na liscie.`}>
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
  emptyState: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 18,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.xl,
  },
  emptyStateCompact: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.md,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
    marginBottom: appTheme.spacing.xs,
  },
  emptyTitle: {
    color: appColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: appTheme.spacing.xs,
  },
});
