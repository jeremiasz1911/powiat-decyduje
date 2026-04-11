import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

import { ErrorState } from '@/src/components/feedback-state';
import {
  DEFAULT_PROJECT_ICON,
  PROJECT_ICON_OPTIONS,
} from '@/src/features/projects/project-icons';
import {
  projectSubmissionSchema,
  type ProjectSubmissionFormValues,
} from '@/src/features/projects/project-submission.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { createProject, ensureAnonymousAuth } from '@/src/services';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

const CATEGORIES = ['Infrastruktura', 'Edukacja', 'Sport', 'Ekologia', 'Kultura', 'Inne'] as const;
const DESCRIPTION_ACTIONS = [
  { key: 'text', label: 'TXT', template: '' },
  { key: 'bullet', label: '•', template: '• ' },
  { key: 'number', label: '1.', template: '1. ' },
  { key: 'h1', label: 'H1', template: '# ' },
  { key: 'h2', label: 'H2', template: '## ' },
  { key: 'h3', label: 'H3', template: '### ' },
  { key: 'h4', label: 'H4', template: '#### ' },
  { key: 'h5', label: 'H5', template: '##### ' },
] as const;

export default function SubmitProjectScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();

  const initialLatitude = Number(params.latitude ?? 53.1126);
  const initialLongitude = Number(params.longitude ?? 20.3843);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const defaultValues = useMemo<ProjectSubmissionFormValues>(
    () => ({
      title: '',
      description: '',
      category: CATEGORIES[0],
      icon: DEFAULT_PROJECT_ICON,
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

  const handlePickImagesFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      await notify('Brak uprawnienia', 'Zezwol na dostep do galerii, aby dodac zdjecie.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.75,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const uris = result.assets.map((asset) => asset.uri).filter(Boolean) as string[];
    if (!uris.length) {
      return;
    }

    setImagePreviews(uris);
    setValue('imageUris', uris, { shouldValidate: true, shouldDirty: true });
    await notify('Zdjecia dodane', `Dodano ${uris.length} zdjec.`, 'success');
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      await notify('Brak uprawnienia', 'Zezwol na dostep do aparatu, aby zrobic zdjecie.', 'error');
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

    const uri = result.assets[0].uri;
    const updated = [...imagePreviews, uri];
    setImagePreviews(updated);
    setValue('imageUris', updated, { shouldValidate: true, shouldDirty: true });
    await notify('Zdjecie dodane', 'Zdjecie z aparatu zostalo dodane do projektu.', 'success');
  };

  const onSubmit = async (values: ProjectSubmissionFormValues) => {
    setSubmitError(null);
    try {
      const user = await ensureAnonymousAuth();
      const projectId = await createProject({
        userId: user.uid,
        title: values.title,
        description: values.description,
        category: values.category,
        icon: values.icon,
        commune: values.commune,
        village: values.village,
        cost: Number(values.cost),
        location: values.location,
        imageUris: values.imageUris,
      });

      await notify('Projekt zapisany', `ID: ${projectId}\nKategoria: ${values.category}`, 'success');
      router.back();
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? `${error.message} [${error.code}]`
          : error instanceof Error
            ? error.message
            : 'Nieznany blad zapisu projektu.';
      setSubmitError(message);
      await notify('Blad zapisu', message, 'error');
    }
  };

  const applyDescriptionTemplate = (
    currentValue: string,
    template: (typeof DESCRIPTION_ACTIONS)[number]['template']
  ) => {
    if (!template) {
      return currentValue;
    }

    return `${currentValue}${currentValue ? '\n' : ''}${template}`;
  };

  return (
    <LinearGradient colors={[futuristicTheme.colors.bgTop, futuristicTheme.colors.bgBottom]} style={styles.gradient}>
      <Box flex={1}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <VStack space="lg">
            <Heading size="lg" color={futuristicTheme.colors.textPrimary}>Zglos projekt</Heading>
            <Text color={futuristicTheme.colors.textMuted}>
            Uzupelnij formularz, aby przeslac nowy projekt do glosowania.
            </Text>

          <Animated.View entering={FadeInDown.duration(220)}>
            <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Tytul</Text>
                <Input style={styles.input}>
                  <InputField
                    placeholder="Np. Plac zabaw na osiedlu"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.title ? <Text color="$error600">{errors.title.message}</Text> : null}
              </VStack>
            )}
            />
          </Animated.View>

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Opis</Text>
                <View style={styles.editorToolbar}>
                  {DESCRIPTION_ACTIONS.map((action) => (
                    <Button
                      key={action.key}
                      size="xs"
                      variant="outline"
                      action="secondary"
                      style={styles.editorButton}
                      onPress={() => onChange(applyDescriptionTemplate(value, action.template))}>
                      <ButtonText color={futuristicTheme.colors.textPrimary}>{action.label}</ButtonText>
                    </Button>
                  ))}
                </View>
                <Input style={styles.input}>
                  <InputField
                    placeholder="Napisz cel projektu, uzasadnienie, zakres i etapy realizacji."
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                    style={styles.descriptionField}
                  />
                </Input>
                <Text color={futuristicTheme.colors.textMuted}>
                  Uzyj TXT, list i H1-H5, aby zbudowac czytelna strukture opisu.
                </Text>
                {errors.description ? <Text color="$error600">{errors.description.message}</Text> : null}
              </VStack>
            )}
          />

          <VStack space="xs">
            <Text color={futuristicTheme.colors.textPrimary}>Kategoria</Text>
            <View style={styles.categoryWrap}>
              {CATEGORIES.map((category) => {
                const selected = selectedCategory === category;
                return (
                  <Button
                    key={category}
                    size="sm"
                    variant={selected ? 'solid' : 'outline'}
                    action={selected ? 'primary' : 'secondary'}
                    borderRadius="$full"
                    style={styles.categoryButton}
                    onPress={() => setValue('category', category, { shouldValidate: true })}>
                    <ButtonText color={futuristicTheme.colors.textPrimary}>{category}</ButtonText>
                  </Button>
                );
              })}
            </View>
            {errors.category ? <Text color="$error600">{errors.category.message}</Text> : null}
          </VStack>

          <VStack space="xs">
            <Text color={futuristicTheme.colors.textPrimary}>Ikona projektu</Text>
            <Button
              size="sm"
              variant="outline"
              action="secondary"
              style={styles.iconSelectTrigger}
              onPress={() => setIsIconPickerOpen((prev) => !prev)}>
              <Ionicons name={selectedIcon} size={18} color={futuristicTheme.colors.textPrimary} />
              <ButtonText color={futuristicTheme.colors.textPrimary}>
                {isIconPickerOpen ? 'Zwin ikony' : 'Rozwin ikony'}
              </ButtonText>
              <Ionicons
                name={isIconPickerOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={16}
                color={futuristicTheme.colors.textPrimary}
              />
            </Button>
            {isIconPickerOpen ? (
              <View style={styles.iconGrid}>
                {PROJECT_ICON_OPTIONS.map((option) => {
                  const selected = selectedIcon === option.id;
                  return (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={selected ? 'solid' : 'outline'}
                      action={selected ? 'primary' : 'secondary'}
                      borderRadius="$md"
                      style={styles.iconOnlyButton}
                      onPress={() => {
                        setValue('icon', option.id, { shouldValidate: true, shouldDirty: true });
                        setIsIconPickerOpen(false);
                      }}>
                      <Ionicons
                        name={option.id}
                        size={20}
                        color={selected ? futuristicTheme.colors.textDark : futuristicTheme.colors.textPrimary}
                      />
                    </Button>
                  );
                })}
              </View>
            ) : null}
            {errors.icon ? <Text color="$error600">{errors.icon.message}</Text> : null}
          </VStack>

          <Controller
            control={control}
            name="commune"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Gmina</Text>
                <Input style={styles.input}>
                  <InputField placeholder="Np. Mlawa" value={value} onBlur={onBlur} onChangeText={onChange} color={futuristicTheme.colors.textPrimary} placeholderTextColor={futuristicTheme.colors.textMuted} />
                </Input>
                {errors.commune ? <Text color="$error600">{errors.commune.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="village"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Miejscowosc</Text>
                <Input style={styles.input}>
                  <InputField placeholder="Np. Mlawa" value={value} onBlur={onBlur} onChangeText={onChange} color={futuristicTheme.colors.textPrimary} placeholderTextColor={futuristicTheme.colors.textMuted} />
                </Input>
                {errors.village ? <Text color="$error600">{errors.village.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="cost"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text color={futuristicTheme.colors.textPrimary}>Szacowany koszt (PLN)</Text>
                <Input style={styles.input}>
                  <InputField
                    placeholder="Np. 120000"
                    keyboardType="decimal-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    color={futuristicTheme.colors.textPrimary}
                    placeholderTextColor={futuristicTheme.colors.textMuted}
                  />
                </Input>
                {errors.cost ? <Text color="$error600">{errors.cost.message}</Text> : null}
              </VStack>
            )}
          />

          <VStack space="xs">
            <Text color={futuristicTheme.colors.textPrimary}>Lokalizacja (z mapy)</Text>
            <Text color={futuristicTheme.colors.textMuted}>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
            {errors.location ? <Text color="$error600">Nieprawidlowa lokalizacja</Text> : null}
          </VStack>

          <VStack space="xs">
            <Text color={futuristicTheme.colors.textPrimary}>Zdjecia projektu</Text>
            <Button onPress={handleTakePhoto} action="secondary" variant="outline" style={styles.ghostButton}>
              <ButtonText color={futuristicTheme.colors.textPrimary}>Zrob zdjecie</ButtonText>
            </Button>
            <Button onPress={handlePickImagesFromLibrary} action="secondary" variant="outline" style={styles.ghostButton}>
              <ButtonText color={futuristicTheme.colors.textPrimary}>{imagePreviews.length ? 'Dodaj/zmien zdjecia z galerii' : 'Dodaj zdjecia z galerii'}</ButtonText>
            </Button>
            {imagePreviews.length ? (
              <View style={styles.previewGrid}>
                {imagePreviews.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.previewItem} />
                ))}
              </View>
            ) : null}
            {errors.imageUris ? <Text color="$error600">{errors.imageUris.message}</Text> : null}
          </VStack>

            <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting} style={styles.primaryButton}>
              <ButtonText color={futuristicTheme.colors.textDark}>{isSubmitting ? 'Wysylanie...' : 'Wyslij projekt'}</ButtonText>
            </Button>
          {submitError ? <ErrorState title="Nie udalo sie wyslac projektu" message={submitError} /> : null}
          </VStack>
        </ScrollView>
      </Box>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    borderRadius: 14,
    borderWidth: 1,
  },
  descriptionField: {
    minHeight: 190,
    paddingTop: 12,
    paddingBottom: 12,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconSelectTrigger: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  iconOnlyButton: {
    width: 46,
    height: 46,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderWidth: 1,
    paddingHorizontal: 0,
  },
  editorToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  editorButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    minWidth: 48,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  previewGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    width: 94,
    height: 94,
    borderRadius: 10,
  },
  ghostButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: futuristicTheme.colors.accent,
    borderRadius: 14,
    ...futuristicShadows.glow,
  },
});
