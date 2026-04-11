import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, ButtonText, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { DescriptionEditorModal } from '@/src/features/projects/components/description-editor-modal';
import { RichDescriptionPreview } from '@/src/features/projects/components/rich-description-preview';
import { DEFAULT_PROJECT_ICON, PROJECT_ICON_OPTIONS } from '@/src/features/projects/project-icons';
import {
  projectSubmissionSchema,
  type ProjectSubmissionFormValues,
} from '@/src/features/projects/project-submission.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { ensureAnonymousAuth, getProjectById, updateProject } from '@/src/services';
import { futuristicShadows, futuristicTheme } from '@/src/theme/futuristic';

const CATEGORIES = ['Infrastruktura', 'Edukacja', 'Sport', 'Ekologia', 'Kultura', 'Inne'] as const;
export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { notify } = useAppFeedback();
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  const defaultValues = useMemo<ProjectSubmissionFormValues>(
    () => ({
      title: '',
      description: '',
      category: CATEGORIES[0],
      icon: DEFAULT_PROJECT_ICON,
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

  const selectedCategory = watch('category');
  const selectedIcon = watch('icon');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setScreenError('Brak identyfikatora projektu.');
        setLoading(false);
        return;
      }

      try {
        const project = await getProjectById(id);
        setValue('title', project.title);
        setValue('description', project.description);
        setValue('category', project.category);
        setValue('icon', project.icon);
        setValue('locationLabel', project.locationLabel ?? '');
        setValue('commune', project.commune);
        setValue('village', project.village);
        setValue('cost', String(project.cost));
        setValue('location', project.location);
        setValue('imageUris', ['existing']);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nie udalo sie pobrac projektu.';
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
        locationLabel: values.locationLabel,
        commune: values.commune,
        village: values.village,
        cost: Number(values.cost),
        location: values.location,
      });
      await notify('Zapisano', 'Projekt zostal zaktualizowany.', 'success');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie zapisac zmian.';
      await notify('Blad edycji', message, 'error');
    }
  };

  if (loading) {
    return <LoadingState label="Ladowanie projektu do edycji..." />;
  }

  if (screenError) {
    return (
      <Box flex={1} bg="$backgroundLight0" p="$4" justifyContent="center">
        <ErrorState message={screenError} />
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$backgroundLight0">
      <ScrollView contentContainerStyle={styles.content}>
        <VStack space="md">
          <Heading size="lg">Edytuj projekt</Heading>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Tytul</Text>
                <Input>
                  <InputField value={value} onBlur={onBlur} onChangeText={onChange} />
                </Input>
                {errors.title ? <Text color="$error600">{errors.title.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Opis</Text>
                <Pressable
                  onPress={() => setIsDescriptionModalOpen(true)}
                  style={styles.textareaPreview}
                  accessibilityRole="button"
                  accessibilityLabel="Otworz edytor opisu">
                  <RichDescriptionPreview
                    content={value}
                    emptyPlaceholder="Tapnij, aby otworzyc pelnoekranowy edytor opisu..."
                    compact
                  />
                </Pressable>
                <Text>Edytor wspiera: pogrubienie, kursywe, listy i naglowki H1-H5.</Text>
                {errors.description ? <Text color="$error600">{errors.description.message}</Text> : null}
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
              </VStack>
            )}
          />

          <VStack space="xs">
            <Text>Kategoria</Text>
            <VStack space="xs">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? 'solid' : 'outline'}
                  action={selectedCategory === category ? 'primary' : 'secondary'}
                  style={selectedCategory === category ? styles.categoryButtonActive : undefined}
                  onPress={() => setValue('category', category, { shouldValidate: true })}>
                  <ButtonText color={selectedCategory === category ? futuristicTheme.colors.textDark : undefined}>
                    {category}
                  </ButtonText>
                </Button>
              ))}
            </VStack>
          </VStack>

          <VStack space="xs">
            <Text>Ikona projektu</Text>
            <Button
              size="sm"
              variant="outline"
              action="secondary"
              style={styles.iconSelectTrigger}
              onPress={() => setIsIconPickerOpen((prev) => !prev)}>
              <Ionicons name={selectedIcon} size={18} />
              <ButtonText>{isIconPickerOpen ? 'Zwin ikony' : 'Rozwin ikony'}</ButtonText>
              <Ionicons name={isIconPickerOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} />
            </Button>
            {isIconPickerOpen ? (
              <VStack space="xs" style={styles.iconGrid}>
                {PROJECT_ICON_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    size="sm"
                    variant={selectedIcon === option.id ? 'solid' : 'outline'}
                    action={selectedIcon === option.id ? 'primary' : 'secondary'}
                    style={styles.iconOnlyButton}
                    onPress={() => {
                      setValue('icon', option.id, { shouldValidate: true, shouldDirty: true });
                      setIsIconPickerOpen(false);
                    }}>
                    <Ionicons name={option.id} size={20} />
                  </Button>
                ))}
              </VStack>
            ) : null}
            {errors.icon ? <Text color="$error600">{errors.icon.message}</Text> : null}
          </VStack>

          <Controller
            control={control}
            name="locationLabel"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Adres / nazwa miejsca</Text>
                <Input>
                  <InputField
                    placeholder="Np. Szkola Podstawowa nr 2, ul. Szkolna 10"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                </Input>
                {errors.locationLabel ? <Text color="$error600">{errors.locationLabel.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="commune"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Gmina</Text>
                <Input>
                  <InputField value={value} onBlur={onBlur} onChangeText={onChange} />
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
                <Text>Miejscowosc</Text>
                <Input>
                  <InputField value={value} onBlur={onBlur} onChangeText={onChange} />
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
                <Text>Koszt</Text>
                <Input>
                  <InputField value={value} onBlur={onBlur} onChangeText={onChange} keyboardType="decimal-pad" />
                </Input>
                {errors.cost ? <Text color="$error600">{errors.cost.message}</Text> : null}
              </VStack>
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
            <ButtonText>{isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOnlyButton: {
    width: 46,
    height: 46,
    paddingHorizontal: 0,
  },
  iconSelectTrigger: {
    justifyContent: 'space-between',
  },
  textareaPreview: {
    borderColor: '#d1d5db',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryButtonActive: {
    backgroundColor: futuristicTheme.colors.accent,
    borderColor: futuristicTheme.colors.accentStrong,
    borderWidth: 1.5,
    ...futuristicShadows.glow,
  },
});
