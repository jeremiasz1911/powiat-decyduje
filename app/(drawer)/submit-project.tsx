import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ErrorState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { SettingsCard, SettingsGroup } from '@/src/components/settings/settings-ui';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppSelect } from '@/src/components/ui/AppSelect';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import { DescriptionEditorModal } from '@/src/features/projects/components/description-editor-modal';
import { MarkerColorPicker } from '@/src/features/projects/components/marker-color-picker';
import { SubmitFormSection } from '@/src/features/projects/components/submit-form-section';
import { createSubmitProjectStyles } from '@/src/features/projects/components/submit-project-themed-styles';
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
import { usePrivateRoute } from '@/src/hooks/use-private-route';
import { createProject, requireSignedInUser } from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const MAX_PROJECT_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 5000;

const DESCRIPTION_PLACEHOLDER =
  'Opisz problem, który chcesz rozwiązać. Wyjaśnij, na czym polega projekt, kto z niego skorzysta i jakie przyniesie korzyści mieszkańcom.';

type SubmitSectionKey =
  | 'title'
  | 'description'
  | 'category'
  | 'icon'
  | 'markerColor'
  | 'location'
  | 'cost'
  | 'images';

const FORM_FIELD_SECTION: Record<keyof ProjectSubmissionFormValues, SubmitSectionKey> = {
  title: 'title',
  description: 'description',
  category: 'category',
  icon: 'icon',
  markerColor: 'markerColor',
  locationLabel: 'location',
  commune: 'location',
  village: 'location',
  location: 'location',
  cost: 'cost',
  imageUris: 'images',
};

const FORM_FIELD_ORDER: (keyof ProjectSubmissionFormValues)[] = [
  'title',
  'description',
  'category',
  'icon',
  'markerColor',
  'locationLabel',
  'commune',
  'village',
  'location',
  'cost',
  'imageUris',
];

function getFirstInvalidField(
  formErrors: FieldErrors<ProjectSubmissionFormValues>
): keyof ProjectSubmissionFormValues | null {
  for (const field of FORM_FIELD_ORDER) {
    if (formErrors[field]) {
      return field;
    }
  }
  return null;
}

function getFieldErrorMessage(
  formErrors: FieldErrors<ProjectSubmissionFormValues>,
  field: keyof ProjectSubmissionFormValues
): string | undefined {
  const error = formErrors[field];
  if (!error) {
    return undefined;
  }
  if (typeof error.message === 'string') {
    return error.message;
  }
  if (field === 'location' && error && typeof error === 'object') {
    const nested = Object.values(error).find(
      (item) => item && typeof item === 'object' && 'message' in item && typeof item.message === 'string'
    );
    return nested && typeof nested.message === 'string' ? nested.message : undefined;
  }
  return undefined;
}

export default function SubmitProjectScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { colors } = useAppTheme();
  const canAccessPrivateFeatures = usePrivateRoute();
  const themed = useMemo(() => createSubmitProjectStyles(colors), [colors]);
  const { activeResidentAccount } = useAuthContext();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();

  const initialLatitude = Number(params.latitude ?? 53.1126);
  const initialLongitude = Number(params.longitude ?? 20.3843);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const sectionsRef = useRef<View>(null);
  const sectionRefs = useRef<Partial<Record<SubmitSectionKey, View | null>>>({});

  const setSectionRef = (section: SubmitSectionKey) => (node: View | null) => {
    sectionRefs.current[section] = node;
  };

  const scrollToFirstError = (formErrors: FieldErrors<ProjectSubmissionFormValues>) => {
    const firstField = getFirstInvalidField(formErrors);
    if (!firstField) {
      return;
    }

    const section = FORM_FIELD_SECTION[firstField];
    const sectionNode = sectionRefs.current[section];
    const containerNode = sectionsRef.current;
    const message = getFieldErrorMessage(formErrors, firstField);

    if (sectionNode && containerNode) {
      sectionNode.measureLayout(
        containerNode,
        (_x, y) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      );
    }

    if (message) {
      void notify('Uzupełnij formularz', message, 'error');
    }
  };

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
      const user = await requireSignedInUser();

      if (!activeResidentAccount) {
        throw new Error('Wybierz profil mieszkańca, aby zgłosić projekt.');
      }

      await createProject({
        userId: user.uid,
        residentAccountId: activeResidentAccount.id,
        residentPesel: activeResidentAccount.pesel,
        residentLabel: activeResidentAccount.label ?? activeResidentAccount.fullName ?? 'Mieszkaniec',
        title: values.title,
        description: values.description,
        category: values.category,
        icon: values.icon,
        markerColor: values.markerColor,
        locationLabel: values.locationLabel,
        commune: values.commune,
        village: values.village,
        cost: values.cost.trim() ? Number(values.cost) : 0,
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
          ? error.code === 'permission-denied'
            ? 'Brak uprawnień do zapisu projektu lub zdjęć. Wdróż reguły: firebase deploy --only firestore:rules,storage'
            : `${error.message} [${error.code}]`
          : error instanceof Error
            ? error.message
            : 'Nieznany błąd zapisu projektu.';
      setSubmitError(message);
      await notify('Błąd zapisu', message, 'error');
    }
  };

  if (!canAccessPrivateFeatures) {
    return null;
  }

  return (
    <AppScreen
      cherryBackground
      scroll
      keyboardAvoiding
      scrollRef={scrollRef}
      contentContainerStyle={styles.content}>
      <View ref={sectionsRef} style={styles.sections}>
        <SettingsCard style={styles.heroCard}>
          <View style={styles.hero}>
            <View style={themed.heroIconWrap}>
              <Ionicons name="bulb-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.heroBody}>
              <Text style={themed.heroTitle}>Zgłoś projekt</Text>
              <Text style={themed.heroText}>
                Masz pomysł, który może poprawić życie mieszkańców? Wypełnij formularz i zgłoś swój projekt do
                Budżetu Obywatelskiego.
              </Text>
            </View>
          </View>
        </SettingsCard>

        <View ref={setSectionRef('title')}>
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
        </View>

        <View ref={setSectionRef('description')}>
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
                      themed.descriptionWrap,
                      descriptionFocused ? themed.descriptionWrapFocused : null,
                      errors.description ? themed.descriptionWrapError : null,
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
                      placeholderTextColor={colors.placeholder}
                      multiline
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      textAlignVertical="top"
                      style={themed.descriptionInput}
                    />
                  </View>
                  <View style={styles.descriptionMeta}>
                    <Text style={themed.charCount}>
                      {descriptionValue.length} / {MAX_DESCRIPTION_LENGTH}
                    </Text>
                    <Pressable
                      onPress={() => setIsDescriptionModalOpen(true)}
                      style={({ pressed }) => [styles.advancedEditorLink, pressed ? styles.pressed : null]}
                      hitSlop={6}>
                      <Ionicons name="expand-outline" size={14} color={colors.primary} />
                      <Text style={themed.advancedEditorText}>Edytor zaawansowany</Text>
                    </Pressable>
                  </View>
                  <Text style={themed.fieldHint}>
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
        </View>

        <SettingsGroup title="Kategoria i ikona">
          <View style={styles.groupSections}>
          <View ref={setSectionRef('category')}>
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
                      themed.chip,
                      selected ? themed.chipSelected : null,
                      pressed ? styles.pressed : null,
                    ]}>
                    <Text style={[themed.chipText, selected ? themed.chipTextSelected : null]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SubmitFormSection>
          </View>

          <View ref={setSectionRef('icon')}>
          <SubmitFormSection icon="apps-outline" title="Ikona projektu" error={errors.icon?.message}>
            <Pressable
              onPress={() => setIsIconPickerOpen((prev) => !prev)}
              style={({ pressed }) => [themed.iconTrigger, pressed ? styles.pressed : null]}>
              <View style={styles.iconTriggerLeft}>
                <View style={themed.iconTriggerBadge}>
                  <Ionicons name={selectedIcon} size={20} color={colors.primary} />
                </View>
                <Text style={themed.iconTriggerText}>Wybierz ikonę projektu</Text>
              </View>
              <Ionicons
                name={isIconPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
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
                        themed.iconOption,
                        selected ? themed.iconOptionSelected : null,
                        pressed ? styles.pressed : null,
                      ]}
                      accessibilityLabel={option.label}>
                      <Ionicons
                        name={option.id}
                        size={20}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </SubmitFormSection>
          </View>

          <View ref={setSectionRef('markerColor')}>
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
          </View>
        </SettingsGroup>

        <View ref={setSectionRef('location')}>
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
                    <Text style={themed.inlineError}>{errors.commune.message}</Text>
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
            <View style={themed.coordsBox}>
              <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
              <Text style={themed.coordsText}>
                Współrzędne z mapy: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
            {errors.location ? <Text style={themed.inlineError}>Nieprawidłowa lokalizacja</Text> : null}
          </SubmitFormSection>
        </SettingsGroup>
        </View>

        <View ref={setSectionRef('cost')}>
        <SettingsGroup title="Budżet">
          <SubmitFormSection
            icon="cash-outline"
            title="Szacowany koszt (opcjonalnie)"
            description="Podaj orientacyjną wartość projektu w PLN, jeśli ją znasz."
            error={errors.cost?.message}>
            <Controller
              control={control}
              name="cost"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Np. 120000 (opcjonalnie)"
                  keyboardType="decimal-pad"
                />
              )}
            />
          </SubmitFormSection>
        </SettingsGroup>
        </View>

        <View ref={setSectionRef('images')}>
        <SettingsGroup title="Zdjęcia">
          <SubmitFormSection
            icon="camera-outline"
            title="Zdjęcia projektu"
            description={`Dodaj od 1 do ${MAX_PROJECT_IMAGES} zdjęć ilustrujących projekt.`}
            error={errors.imageUris?.message}>
            <View style={themed.uploadBox}>
              <View style={themed.uploadIconWrap}>
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
              </View>
              <Text style={themed.uploadTitle}>Dodaj zdjęcia</Text>
              <Text style={themed.uploadHint}>Zrób zdjęcie aparatem lub wybierz z galerii.</Text>
              <View style={styles.uploadActions}>
                <Pressable
                  onPress={() => void handleTakePhoto()}
                  disabled={imagePreviews.length >= MAX_PROJECT_IMAGES}
                  style={({ pressed }) => [
                    themed.uploadAction,
                    pressed ? styles.pressed : null,
                    imagePreviews.length >= MAX_PROJECT_IMAGES ? styles.uploadActionDisabled : null,
                  ]}>
                  <Ionicons name="camera" size={16} color={colors.primary} />
                  <Text style={themed.uploadActionText}>Aparat</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handlePickImagesFromLibrary()}
                  disabled={imagePreviews.length >= MAX_PROJECT_IMAGES}
                  style={({ pressed }) => [
                    themed.uploadAction,
                    pressed ? styles.pressed : null,
                    imagePreviews.length >= MAX_PROJECT_IMAGES ? styles.uploadActionDisabled : null,
                  ]}>
                  <Ionicons name="images-outline" size={16} color={colors.primary} />
                  <Text style={themed.uploadActionText}>Galeria</Text>
                </Pressable>
              </View>
            </View>

            {imagePreviews.length > 0 ? (
              <View style={styles.previewGrid}>
                {imagePreviews.map((uri) => (
                  <View key={uri} style={styles.previewItemWrap}>
                    <Image source={{ uri }} style={themed.previewItem} resizeMode="cover" />
                    <Pressable
                      onPress={() => handleRemoveImage(uri)}
                      style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
                      accessibilityLabel="Usuń zdjęcie"
                      hitSlop={6}>
                      <Ionicons name="close" size={14} color={colors.textOnPrimary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={themed.fieldHint}>
              {imagePreviews.length}/{MAX_PROJECT_IMAGES} zdjęć dodanych
            </Text>
          </SubmitFormSection>
        </SettingsGroup>
        </View>

        {submitError ? <ErrorState title="Nie udało się wysłać projektu" message={submitError} /> : null}

        <View style={styles.submitWrap}>
          <AppButton
            title="Wyślij projekt"
            loadingTitle="Wysyłanie..."
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit(onSubmit, scrollToFirstError)}
            style={themed.submitButton}
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
  heroBody: {
    flex: 1,
    gap: 6,
  },
  descriptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.sm,
  },
  advancedEditorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  iconTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
  uploadActionDisabled: {
    opacity: 0.5,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.sm,
  },
  previewItemWrap: {
    position: 'relative',
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
  pressed: {
    opacity: 0.86,
  },
});
