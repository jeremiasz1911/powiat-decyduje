import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { SettingsCard, SettingsGroup } from '@/src/components/settings/settings-ui';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppSelect } from '@/src/components/ui/AppSelect';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { CompactIconAction } from '@/src/features/projects/components/compact-icon-action';
import { DescriptionEditorModal } from '@/src/features/projects/components/description-editor-modal';
import { MarkerColorPicker } from '@/src/features/projects/components/marker-color-picker';
import { ProjectRemoteImage } from '@/src/features/projects/components/project-remote-image';
import { SubmitFormSection } from '@/src/features/projects/components/submit-form-section';
import { PROJECT_CATEGORIES, PROJECT_COMMUNES } from '@/src/features/projects/constants';
import {
  DEFAULT_PROJECT_ICON,
  PROJECT_ICON_OPTIONS,
} from '@/src/features/projects/project-icons';
import { DEFAULT_PROJECT_MARKER_COLOR } from '@/src/features/projects/project-marker-colors';
import {
  projectSubmissionSchema,
  type ProjectSubmissionFormValues,
} from '@/src/features/projects/project-submission.schema';
import { getProjectImageUrls } from '@/src/features/projects/utils';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { ensureAnonymousAuth, getProjectById, updateProject } from '@/src/services';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

const MAX_DESCRIPTION_LENGTH = 5000;

const DESCRIPTION_PLACEHOLDER =
  'Opisz problem, który chcesz rozwiązać. Wyjaśnij, na czym polega projekt, kto z niego skorzysta i jakie przyniesie korzyści mieszkańcom.';

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { notify } = useAppFeedback();
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const defaultValues = useMemo<ProjectSubmissionFormValues>(
    () => ({
      title: '',
      description: '',
      category: PROJECT_CATEGORIES[0],
      icon: DEFAULT_PROJECT_ICON,
      markerColor: DEFAULT_PROJECT_MARKER_COLOR,
      locationLabel: '',
      commune: 'Mlawa',
      village: 'Mlawa',
      cost: '',
      location: {
        latitude: 53.1126,
        longitude: 20.3843,
      },
      imageUris: ['existing'],
    }),
    []
  );

  const communeOptions = useMemo(
    () => PROJECT_COMMUNES.map((commune) => ({ label: commune, value: commune })),
    []
  );

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectSubmissionFormValues>({
    resolver: zodResolver(projectSubmissionSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const location = watch('location');
  const selectedCategory = watch('category');
  const selectedIcon = watch('icon');
  const descriptionValue = watch('description');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setScreenError('Brak identyfikatora projektu.');
        setLoading(false);
        return;
      }

      try {
        const user = await ensureAnonymousAuth();
        const project = await getProjectById(id, { userId: user.uid });
        setValue('title', project.title);
        setValue('description', project.description);
        setValue('category', project.category as (typeof PROJECT_CATEGORIES)[number]);
        setValue('icon', project.icon);
        setValue('markerColor', project.markerColor);
        setValue('locationLabel', project.locationLabel ?? '');
        setValue('commune', project.commune);
        setValue('village', project.village);
        setValue('cost', String(project.cost));
        setValue('location', project.location);
        setValue('imageUris', ['existing']);
        setExistingImages(getProjectImageUrls(project));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nie udało się pobrać projektu.';
        setScreenError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, setValue]);

  const onSubmit = async (values: ProjectSubmissionFormValues) => {
    if (!id) {
      return;
    }

    try {
      const user = await ensureAnonymousAuth();
      await updateProject(id, user.uid, {
        title: values.title,
        description: values.description,
        category: values.category,
        icon: values.icon,
        markerColor: values.markerColor,
        locationLabel: values.locationLabel,
        commune: values.commune,
        village: values.village,
        cost: Number(values.cost),
        location: values.location,
      });
      await notify('Zapisano', 'Projekt został zaktualizowany.', 'success');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zapisać zmian.';
      await notify('Błąd edycji', message, 'error');
    }
  };

  if (loading) {
    return <LoadingState label="Ładowanie projektu do edycji..." />;
  }

  if (screenError) {
    return (
      <AppScreen cherryBackground>
        <ErrorState message={screenError} />
      </AppScreen>
    );
  }

  return (
    <AppScreen cherryBackground scroll keyboardAvoiding contentContainerStyle={styles.content}>
      <View style={styles.sections}>
        <SettingsCard style={styles.heroCard}>
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="create-outline" size={28} color={appColors.primary} />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>Edytuj projekt</Text>
              <Text style={styles.heroText}>
                Zaktualizuj dane zgłoszenia. Zmiany zostaną zapisane po kliknięciu „Zapisz zmiany”.
              </Text>
            </View>
          </View>
        </SettingsCard>

        <SettingsGroup title="Podstawowe dane">
          <SubmitFormSection
            icon="document-text-outline"
            title="Tytuł projektu"
            description="Krótki, konkretny tytuł ułatwia ocenę zgłoszenia.">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Np. Plac zabaw na osiedlu"
                  error={errors.title?.message}
                />
              )}
            />
          </SubmitFormSection>
        </SettingsGroup>

        <SettingsGroup title="Opis">
          <SubmitFormSection
            icon="create-outline"
            title="Opis projektu"
            description="Im bardziej szczegółowy opis, tym łatwiej ocenić projekt."
            error={errors.description?.message}>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View
                    style={[
                      styles.descriptionWrap,
                      descriptionFocused ? styles.descriptionWrapFocused : null,
                      errors.description ? styles.descriptionWrapError : null,
                    ]}>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur();
                        setDescriptionFocused(false);
                      }}
                      onFocus={() => setDescriptionFocused(true)}
                      placeholder={DESCRIPTION_PLACEHOLDER}
                      placeholderTextColor={appColors.placeholder}
                      multiline
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      textAlignVertical="top"
                      style={styles.descriptionInput}
                    />
                  </View>
                  <View style={styles.descriptionMeta}>
                    <Text style={styles.charCount}>
                      {descriptionValue.length} / {MAX_DESCRIPTION_LENGTH}
                    </Text>
                    <Pressable
                      onPress={() => setIsDescriptionModalOpen(true)}
                      style={({ pressed }) => [styles.advancedEditorLink, pressed ? styles.pressed : null]}
                      hitSlop={6}>
                      <Ionicons name="expand-outline" size={14} color={appColors.primary} />
                      <Text style={styles.advancedEditorText}>Edytor zaawansowany</Text>
                    </Pressable>
                  </View>
                  <DescriptionEditorModal
                    visible={isDescriptionModalOpen}
                    value={value}
                    onChange={onChange}
                    onClose={() => {
                      onBlur();
                      setIsDescriptionModalOpen(false);
                    }}
                    title="Opis projektu"
                  />
                </>
              )}
            />
          </SubmitFormSection>
        </SettingsGroup>

        <SettingsGroup title="Lokalizacja i kategoria">
          <View style={styles.groupSections}>
            <SubmitFormSection icon="pricetag-outline" title="Kategoria" error={errors.category?.message}>
              <View style={styles.chipWrap}>
                {PROJECT_CATEGORIES.map((category) => {
                  const selected = selectedCategory === category;
                  return (
                    <Pressable
                      key={category}
                      onPress={() => setValue('category', category, { shouldValidate: true })}
                      style={({ pressed }) => [
                        styles.chip,
                        selected ? styles.chipSelected : null,
                        pressed ? styles.pressed : null,
                      ]}>
                      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SubmitFormSection>

            <SubmitFormSection icon="apps-outline" title="Ikona projektu" error={errors.icon?.message}>
              <Pressable
                onPress={() => setIsIconPickerOpen((prev) => !prev)}
                style={({ pressed }) => [styles.iconTrigger, pressed ? styles.pressed : null]}>
                <View style={styles.iconTriggerLeft}>
                  <View style={styles.iconTriggerBadge}>
                    <Ionicons name={selectedIcon} size={20} color={appColors.primary} />
                  </View>
                  <Text style={styles.iconTriggerText}>Wybierz ikonę projektu</Text>
                </View>
                <Ionicons
                  name={isIconPickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={appColors.textMuted}
                />
              </Pressable>
              {isIconPickerOpen ? (
                <View style={styles.iconGrid}>
                  {PROJECT_ICON_OPTIONS.map((option) => {
                    const selected = selectedIcon === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          setValue('icon', option.id, { shouldValidate: true, shouldDirty: true });
                          setIsIconPickerOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.iconOption,
                          selected ? styles.iconOptionSelected : null,
                          pressed ? styles.pressed : null,
                        ]}
                        accessibilityLabel={option.label}>
                        <Ionicons
                          name={option.id}
                          size={20}
                          color={selected ? appColors.primary : appColors.textSecondary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </SubmitFormSection>

            <SubmitFormSection
              icon="color-palette-outline"
              title="Kolor pinezki na mapie"
              error={errors.markerColor?.message}>
              <Controller
                control={control}
                name="markerColor"
                render={({ field: { onChange, value } }) => (
                  <MarkerColorPicker value={value} onChange={onChange} />
                )}
              />
            </SubmitFormSection>

            <SubmitFormSection
              icon="location-outline"
              title="Lokalizacja"
              description="Podaj adres lub nazwę miejsca oraz gminę.">
              <Controller
                control={control}
                name="locationLabel"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Np. Szkoła Podstawowa nr 2, ul. Szkolna 10"
                    error={errors.locationLabel?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="commune"
                render={({ field: { onChange, value } }) => (
                  <>
                    <AppSelect
                      label="Gmina"
                      value={value}
                      options={communeOptions}
                      onChange={onChange}
                      placeholder="Wybierz gminę"
                    />
                    {errors.commune?.message ? (
                      <Text style={styles.inlineError}>{errors.commune.message}</Text>
                    ) : null}
                  </>
                )}
              />
              <Controller
                control={control}
                name="village"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Np. Mława"
                    error={errors.village?.message}
                  />
                )}
              />
              <View style={styles.coordsBox}>
                <Ionicons name="navigate-outline" size={16} color={appColors.textMuted} />
                <Text style={styles.coordsText}>
                  Współrzędne: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
              </View>
            </SubmitFormSection>
          </View>
        </SettingsGroup>

        <SettingsGroup title="Budżet">
          <SubmitFormSection
            icon="cash-outline"
            title="Szacowany koszt"
            description="Podaj orientacyjną wartość projektu w PLN."
            error={errors.cost?.message}>
            <Controller
              control={control}
              name="cost"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Np. 120000"
                  keyboardType="decimal-pad"
                />
              )}
            />
          </SubmitFormSection>
        </SettingsGroup>

        {existingImages.length > 0 ? (
          <SettingsGroup title="Zdjęcia">
            <SubmitFormSection
              icon="camera-outline"
              title="Zdjęcia projektu"
              description="Aktualne zdjęcia przypisane do projektu. Edycja zdjęć nie jest jeszcze dostępna w tej wersji.">
              <View style={styles.previewGrid}>
                {existingImages.map((uri, index) => (
                  <ProjectRemoteImage
                    key={`${uri}-${index}`}
                    uri={uri}
                    style={styles.previewItem}
                    resizeMode="cover"
                  />
                ))}
              </View>
            </SubmitFormSection>
          </SettingsGroup>
        ) : null}

        <View style={styles.actions}>
          <CompactIconAction
            icon="close"
            label="Anuluj"
            onPress={() => router.back()}
            accessibilityLabel="Anuluj edycję"
            variant="default"
          />
          <AppButton
            title="Zapisz zmiany"
            loadingTitle="Zapisywanie..."
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={styles.saveButton}
            fullWidth={false}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
  },
  sections: {
    gap: appTheme.spacing.lg,
  },
  groupSections: {
    gap: appTheme.spacing.md,
  },
  heroCard: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.md,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  heroBody: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: appColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroText: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  descriptionWrap: {
    minHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceSoft,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
  },
  descriptionWrapFocused: {
    borderColor: appColors.primary,
    backgroundColor: appColors.surface,
  },
  descriptionWrapError: {
    borderColor: appColors.danger,
  },
  descriptionInput: {
    minHeight: 148,
    color: appColors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  descriptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.sm,
  },
  charCount: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  advancedEditorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  advancedEditorText: {
    color: appColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceSoft,
  },
  chipSelected: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  chipText: {
    color: appColors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: appColors.primary,
  },
  iconTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 14,
    backgroundColor: appColors.surfaceSoft,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 12,
  },
  iconTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  iconTriggerBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  iconTriggerText: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderRadius: 12,
    backgroundColor: appColors.surfaceSoft,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  coordsText: {
    flex: 1,
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineError: {
    color: appColors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  previewItem: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: appColors.surfaceSoft,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.sm,
  },
  saveButton: {
    minHeight: 44,
    paddingHorizontal: appTheme.spacing.lg,
    ...appShadows.button,
  },
  pressed: {
    opacity: 0.86,
  },
});
