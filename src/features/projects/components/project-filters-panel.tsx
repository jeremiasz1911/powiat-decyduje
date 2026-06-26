import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { AppSelect, type AppSelectOption } from '@/src/components/ui/AppSelect';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import {
  ALL_CATEGORIES_LABEL,
  ALL_COMMUNES_LABEL,
  PROJECT_CATEGORIES,
  PROJECT_COMMUNES,
} from '@/src/features/projects/constants';
import { appColors, appTheme } from '@/src/theme/app-theme';

type ProjectFiltersPanelProps = {
  search: string;
  selectedCategory: string;
  selectedCommune: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCommuneChange: (value: string) => void;
  onClearFilters: () => void;
  resultsCount: number;
};

const DESKTOP_BREAKPOINT = 768;

export function ProjectFiltersPanel({
  search,
  selectedCategory,
  selectedCommune,
  onSearchChange,
  onCategoryChange,
  onCommuneChange,
  onClearFilters,
  resultsCount,
}: ProjectFiltersPanelProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const [expanded, setExpanded] = useState(isDesktop);

  const hasActiveFilters = Boolean(search.trim() || selectedCategory || selectedCommune);

  const categoryOptions = useMemo<AppSelectOption[]>(
    () => [
      { label: ALL_CATEGORIES_LABEL, value: '' },
      ...PROJECT_CATEGORIES.map((category) => ({ label: category, value: category })),
    ],
    []
  );

  const communeOptions = useMemo<AppSelectOption[]>(
    () => [
      { label: ALL_COMMUNES_LABEL, value: '' },
      ...PROJECT_COMMUNES.map((commune) => ({ label: commune, value: commune })),
    ],
    []
  );

  const sectionFooter = hasActiveFilters
    ? `Aktywne filtry · ${resultsCount} wynikow`
    : `Przeszukaj projekty obywatelskie · ${resultsCount} wynikow`;

  return (
    <SettingsGroup title="Filtry i wyszukiwanie" footer={sectionFooter}>
      <SettingsCard style={styles.card}>
        {!isDesktop ? (
          <Pressable onPress={() => setExpanded((prev) => !prev)} style={styles.toggleRow}>
            <Text style={styles.toggleText}>{expanded ? 'Ukryj filtry' : 'Pokaz filtry'}</Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={appColors.textMuted}
            />
          </Pressable>
        ) : null}

        {expanded || isDesktop ? (
          <View style={styles.filtersBody}>
            <AppTextInput
              label="Szukaj"
              value={search}
              onChangeText={onSearchChange}
              placeholder="Nazwa lub opis projektu…"
              containerStyle={styles.field}
              inputStyle={styles.compactInput}
            />

            <View style={[styles.selectRow, isDesktop ? styles.selectRowDesktop : null]}>
              <AppSelect
                label="Kategoria"
                value={selectedCategory}
                options={categoryOptions}
                onChange={onCategoryChange}
                placeholder={ALL_CATEGORIES_LABEL}
              />
              <AppSelect
                label="Gmina"
                value={selectedCommune}
                options={communeOptions}
                onChange={onCommuneChange}
                placeholder={ALL_COMMUNES_LABEL}
              />
            </View>

            {hasActiveFilters ? (
              <SettingsRow
                label="Wyczysc filtry"
                icon="close-circle-outline"
                onPress={onClearFilters}
                showChevron={false}
              />
            ) : null}
          </View>
        ) : null}
      </SettingsCard>
    </SettingsGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: appTheme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
  },
  toggleText: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  filtersBody: {
    gap: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.sm,
  },
  field: {
    gap: 6,
  },
  compactInput: {
    minHeight: 44,
    borderRadius: 12,
    fontSize: 15,
  },
  selectRow: {
    gap: appTheme.spacing.md,
  },
  selectRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
