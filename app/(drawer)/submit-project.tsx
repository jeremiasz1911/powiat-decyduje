import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ErrorState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { SettingsCard, SettingsGroup } from '@/src/components/settings/settings-ui';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppSelect } from '@/src/components/ui/AppSelect';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { DescriptionEditorModal } from '@/src/features/projects/components/description-editor-modal';
import { MarkerColorPicker } from '@/src/features/projects/components/marker-color-picker';
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
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { createProject, ensureAnonymousAuth } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

const MAX_PROJECT_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 5000;

const DESCRIPTION_PLACEHOLDER =
  'Opisz problem, który chcesz rozwiązać. Wyjaśnij, na czym polega projekt, kto z niego skorzysta i jakie przyniesie korzyści mieszkańcom.';

export default function SubmitProjectScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { activeResidentAccount } = useAuthContext();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();

  const initialLatitude = Number(params.latitude ?? 53.1126);
  const initialLongitude = Number(params.longitude ?? 20.3843);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

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
        latitude: Number.isFinite(initialLatitude) ? initialLatitude : 53.1126,
        longitude: Number.isFinite(initialLongitude) ? initialLongitude : 20.3843,
      },
      imageUris: [],
    }),
    [initialLatitude, initialLongitude]
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

  const updateImages = (uris: string[]) => {
    setImagePreviews(uris);
    setValue('imageUris', uris, { shouldValidate: true, shouldDirty: true });
  };

  const handlePickImagesFromLibrary = async () => {
    const remainingSlots = MAX_PROJECT_IMAGES - imagePreviews.length;
    if (remainingSlots <= 0) {
      await notify('Limit zdjęć', `Możesz dodać maksymalnie ${MAX_PROJECT_IMAGES} zdjęć.`, 'info');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await notify('Brak uprawnienia', 'Zezwól na dostęp do galerii, aby dodać zdjęcie.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.75,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const uris = result.assets.map((asset) => asset.uri).filter(Boolean) as string[];
    if (!uris.length) {
      return;
    }

    const merged = [...imagePreviews, ...uris].slice(0, MAX_PROJECT_IMAGES);
    updateImages(merged);
    await notify(
      'Zdjęcia dodane',
      `Łącznie: ${merged.length}/${MAX_PROJECT_IMAGES} zdjęć.`,
      merged.length === MAX_PROJECT_IMAGES ? 'info' : 'success'
    );
  };

  const handleTakePhoto = async () => {
    if (imagePreviews.length >= MAX_PROJECT_IMAGES) {
      await notify('Limit zdjęć', `Możesz dodać maksymalnie ${MAX_PROJECT_IMAGES} zdjęć.`, 'info');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      await notify('Brak uprawnienia', 'Zezwól na dostęp do aparatu, aby zrobić zdjęcie.', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const updated = [...imagePreviews, result.assets[0].uri].slice(0, MAX_PROJECT_IMAGES);
    updateImages(updated);
    await notify('Zdjęcie dodane', `Łącznie: ${updated.length}/${MAX_PROJECT_IMAGES} zdjęć.`, 'success');
  };

  const handleRemoveImage = (uri: string) => {
    updateImages(imagePreviews.filter((item) => item !== uri));
  };

  const onSubmit = async (values: ProjectSubmissionFormValues) => {
    setSubmitError(null);
    try {
      if (!activeResidentAccount) {
        throw new Error('Wybierz aktywne konto mieszkańca, aby zgłosić projekt.');
      }

      const user = await ensureAnonymousAuth();
      await createProject({
        userId: user.uid,
        residentAccountId: activeResidentAccount.id,
        residentPesel: activeResidentAccount.pesel,
        residentLabel: activeResidentAccount.label ?? activeResidentAccount.fullName,
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
        imageUris: values.imageUris,
      });

      await notify(
        'Projekt zgłoszony',
        'Projekt został zgłoszony i oczekuje na weryfikację. Po zaakceptowaniu przez administratora będzie widoczny publicznie na liście projektów i mapie.',
        'success'
      );
      router.back();
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? `${error.message} [${error.code}]`
          : error instanceof Error
            ? error.message
            : 'Nieznany błąd zapisu projektu.';
      setSubmitError(message);
      await notify('Błąd zapisu', message, 'error');
    }
  };

  return (
    <AppScreen cherryBackground scroll keyboardAvoiding contentContainerStyle={styles.content}>
      <View style={styles.sections}>
        <SettingsCard style={styles.heroCard}>
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="bulb-outline" size={28} color={appColors.primary} />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>Zgłoś projekt</Text>
              <Text style={styles.heroText}>
                Masz pomysł, który może poprawić życie mieszkańców? Wypełnij formularz i zgłoś swój
                projekt do Budżetu Obywatelskiego.
              </Text>
            </View>
          </View>
        </SettingsCard>

        <SettingsGroup title="Podstawowe informacje">
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

        <SettingsGroup title="Opis projektu">
          <SubmitFormSection
            icon="create-outline"
            title="Opis"
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
                  <Text style={styles.fieldHint}>
                    W edytorze zaawansowanym możesz używać pogrubienia, list i nagłówków.
                  </Text>
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

        <SettingsGroup title="Kategoria i ikona">
          <View style={styles.groupSections}>
          <SubmitFormSection
            icon="pricetag-outline"
            title="Kategoria"
            error={errors.category?.message}>
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
            description="Wybierz kolor markera widocznego na mapie projektów."
            error={errors.markerColor?.message}>
            <Controller
              control={control}
              name="markerColor"
              render={({ field: { onChange, value } }) => (
                <MarkerColorPicker value={value} onChange={onChange} />
              )}
            />
          </SubmitFormSection>
          </View>
        </SettingsGroup>

        <SettingsGroup title="Lokalizacja">
          <SubmitFormSection
            icon="location-outline"
            title="Gdzie realizowany jest projekt?"
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
                Współrzędne z mapy: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
            {errors.location ? <Text style={styles.inlineError}>Nieprawidłowa lokalizacja</Text> : null}
          </SubmitFormSection>
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

        <SettingsGroup title="Zdjęcia">
          <SubmitFormSection
            icon="camera-outline"
            title="Zdjęcia projektu"
            description={`Dodaj od 1 do ${MAX_PROJECT_IMAGES} zdjęć ilustrujących projekt.`}
            error={errors.imageUris?.message}>
            <View style={styles.uploadBox}>
              <View style={styles.uploadIconWrap}>
                <Ionicons name="camera-outline" size={24} color={appColors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Dodaj zdjęcia</Text>
              <Text style={styles.uploadHint}>Zrób zdjęcie aparatem lub wybierz z galerii.</Text>
              <View style={styles.uploadActions}>
                <Pressable
                  onPress={() => void handleTakePhoto()}
                  disabled={imagePreviews.length >= MAX_PROJECT_IMAGES}
                  style={({ pressed }) => [
                    styles.uploadAction,
                    pressed ? styles.pressed : null,
                    imagePreviews.length >= MAX_PROJECT_IMAGES ? styles.uploadActionDisabled : null,
                  ]}>
                  <Ionicons name="camera" size={16} color={appColors.primary} />
                  <Text style={styles.uploadActionText}>Aparat</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handlePickImagesFromLibrary()}
                  disabled={imagePreviews.length >= MAX_PROJECT_IMAGES}
                  style={({ pressed }) => [
                    styles.uploadAction,
                    pressed ? styles.pressed : null,
                    imagePreviews.length >= MAX_PROJECT_IMAGES ? styles.uploadActionDisabled : null,
                  ]}>
                  <Ionicons name="images-outline" size={16} color={appColors.primary} />
                  <Text style={styles.uploadActionText}>Galeria</Text>
                </Pressable>
              </View>
            </View>

            {imagePreviews.length > 0 ? (
              <View style={styles.previewGrid}>
                {imagePreviews.map((uri) => (
                  <View key={uri} style={styles.previewItemWrap}>
                    <Image source={{ uri }} style={styles.previewItem} resizeMode="cover" />
                    <Pressable
                      onPress={() => handleRemoveImage(uri)}
                      style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
                      accessibilityLabel="Usuń zdjęcie"
                      hitSlop={6}>
                      <Ionicons name="close" size={14} color={appColors.textOnPrimary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.fieldHint}>
              {imagePreviews.length}/{MAX_PROJECT_IMAGES} zdjęć dodanych
            </Text>
          </SubmitFormSection>
        </SettingsGroup>

        {submitError ? <ErrorState title="Nie udało się wysłać projektu" message={submitError} /> : null}

        <View style={styles.submitWrap}>
          <AppButton
            title="Wyślij projekt"
            loadingTitle="Wysyłanie..."
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
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
  fieldHint: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
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
  uploadBox: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: appColors.border,
    borderRadius: 16,
    backgroundColor: appColors.surfaceSoft,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  uploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  uploadTitle: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  uploadHint: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
  uploadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  uploadActionDisabled: {
    opacity: 0.5,
  },
  uploadActionText: {
    color: appColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  previewItemWrap: {
    position: 'relative',
  },
  previewItem: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: appColors.surfaceSoft,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 29, 43, 0.72)',
  },
  submitWrap: {
    paddingTop: appTheme.spacing.sm,
  },
  submitButton: {
    ...appShadows.button,
  },
  pressed: {
    opacity: 0.86,
  },
});
