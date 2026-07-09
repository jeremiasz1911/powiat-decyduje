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
import { appTheme } from '@/src/theme/app-theme';
import { useAppTheme } from '@/src/theme/theme-context';

type ProjectFiltersPanelProps = {
  search: string;
  selectedCategory: string;
  selectedCommune: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCommuneChange: (value: string) => void;
  onClearFilters: () => void;
  resultsCount: number;
  variant?: 'default' | 'minimal';
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
  variant = 'default',
}: ProjectFiltersPanelProps) {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
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

  const filtersBody = (
    <>
      {!isDesktop ? (
        <Pressable onPress={() => setExpanded((prev) => !prev)} style={styles.toggleRow}>
          <Text style={[styles.toggleText, { color: colors.textPrimary }]}>
            {expanded ? 'Ukryj filtry' : 'Pokaz filtry'}
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}

      {expanded || isDesktop ? (
        <View style={[styles.filtersBody, variant === 'minimal' ? styles.filtersBodyMinimal : null]}>
          <AppTextInput
            variant={variant === 'minimal' ? 'minimal' : 'default'}
            label="Szukaj"
            value={search}
            onChangeText={onSearchChange}
            placeholder="Nazwa lub opis projektu…"
            containerStyle={styles.field}
            inputStyle={variant === 'minimal' ? undefined : styles.compactInput}
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
            variant === 'minimal' ? (
              <Pressable onPress={onClearFilters} style={styles.clearLink}>
                <Text style={[styles.clearLinkText, { color: colors.primary }]}>Wyczyść filtry</Text>
              </Pressable>
            ) : (
              <SettingsRow
                label="Wyczysc filtry"
                icon="close-circle-outline"
                onPress={onClearFilters}
                showChevron={false}
              />
            )
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (variant === 'minimal') {
    return (
      <View style={styles.minimalWrap}>
        <Text style={[styles.minimalTitle, { color: colors.textPrimary }]}>Filtry i wyszukiwanie</Text>
        <Text style={[styles.minimalFooter, { color: colors.textMuted }]}>{sectionFooter}</Text>
        {filtersBody}
      </View>
    );
  }

  return (
    <SettingsGroup title="Filtry i wyszukiwanie" footer={sectionFooter}>
      <SettingsCard style={styles.card}>{filtersBody}</SettingsCard>
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
  minimalWrap: {
    gap: appTheme.spacing.md,
  },
  minimalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  minimalFooter: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -appTheme.spacing.xs,
  },
  filtersBodyMinimal: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  clearLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  clearLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
