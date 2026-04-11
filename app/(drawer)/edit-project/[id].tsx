import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, ButtonText, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { DEFAULT_PROJECT_ICON, PROJECT_ICON_OPTIONS } from '@/src/features/projects/project-icons';
import {
  projectSubmissionSchema,
  type ProjectSubmissionFormValues,
} from '@/src/features/projects/project-submission.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { ensureAnonymousAuth, getProjectById, updateProject } from '@/src/services';

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

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { notify } = useAppFeedback();
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
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

  const applyDescriptionTemplate = (
    currentValue: string,
    template: (typeof DESCRIPTION_ACTIONS)[number]['template']
  ) => {
    if (!template) {
      return currentValue;
    }

    return `${currentValue}${currentValue ? '\n' : ''}${template}`;
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
                <View style={styles.editorToolbar}>
                  {DESCRIPTION_ACTIONS.map((action) => (
                    <Button
                      key={action.key}
                      size="xs"
                      variant="outline"
                      action="secondary"
                      style={styles.editorButton}
                      onPress={() => onChange(applyDescriptionTemplate(value, action.template))}>
                      <ButtonText>{action.label}</ButtonText>
                    </Button>
                  ))}
                </View>
                <Input>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={20}
                    textAlignVertical="top"
                  />
                </Input>
                <Text>Uzyj TXT, list i H1-H5, aby zbudowac czytelna strukture opisu.</Text>
                {errors.description ? <Text color="$error600">{errors.description.message}</Text> : null}
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
                  onPress={() => setValue('category', category, { shouldValidate: true })}>
                  <ButtonText>{category}</ButtonText>
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
  editorButton: {
    minWidth: 48,
  },
  editorToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
});
