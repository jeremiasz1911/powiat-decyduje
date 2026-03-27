import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
  projectSubmissionSchema,
  type ProjectSubmissionFormValues,
} from '@/src/features/projects/project-submission.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { createProject, ensureAnonymousAuth } from '@/src/services';

const CATEGORIES = ['Infrastruktura', 'Edukacja', 'Sport', 'Ekologia', 'Kultura'] as const;

export default function SubmitProjectScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();

  const initialLatitude = Number(params.latitude ?? 53.1126);
  const initialLongitude = Number(params.longitude ?? 20.3843);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo<ProjectSubmissionFormValues>(
    () => ({
      title: '',
      description: '',
      category: CATEGORIES[0],
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
        commune: values.commune,
        village: values.village,
        cost: Number(values.cost),
        location: values.location,
        imageUris: values.imageUris,
      });

      await notify('Projekt zapisany', `ID: ${projectId}\nKategoria: ${values.category}`, 'success');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nieznany blad zapisu projektu.';
      setSubmitError(message);
      await notify('Blad zapisu', message, 'error');
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight0">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <VStack space="lg">
          <Heading size="lg">Zglos projekt</Heading>
          <Text color="$textLight600">
            Uzupelnij formularz, aby przeslac nowy projekt do glosowania.
          </Text>

          <Animated.View entering={FadeInDown.duration(220)}>
            <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Tytul</Text>
                <Input>
                  <InputField
                    placeholder="Np. Plac zabaw na osiedlu"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
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
                <Text>Opis</Text>
                <Input>
                  <InputField
                    placeholder="Opisz projekt i uzasadnienie"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={4}
                  />
                </Input>
                {errors.description ? <Text color="$error600">{errors.description.message}</Text> : null}
              </VStack>
            )}
          />

          <VStack space="xs">
            <Text>Kategoria</Text>
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
                    onPress={() => setValue('category', category, { shouldValidate: true })}>
                    <ButtonText>{category}</ButtonText>
                  </Button>
                );
              })}
            </View>
            {errors.category ? <Text color="$error600">{errors.category.message}</Text> : null}
          </VStack>

          <Controller
            control={control}
            name="commune"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Gmina</Text>
                <Input>
                  <InputField placeholder="Np. Mlawa" value={value} onBlur={onBlur} onChangeText={onChange} />
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
                  <InputField placeholder="Np. Mlawa" value={value} onBlur={onBlur} onChangeText={onChange} />
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
                <Text>Szacowany koszt (PLN)</Text>
                <Input>
                  <InputField
                    placeholder="Np. 120000"
                    keyboardType="decimal-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                </Input>
                {errors.cost ? <Text color="$error600">{errors.cost.message}</Text> : null}
              </VStack>
            )}
          />

          <VStack space="xs">
            <Text>Lokalizacja (z mapy)</Text>
            <Text color="$textLight700">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
            {errors.location ? <Text color="$error600">Nieprawidlowa lokalizacja</Text> : null}
          </VStack>

          <VStack space="xs">
            <Text>Zdjecia projektu</Text>
            <Button onPress={handleTakePhoto} action="secondary" variant="outline">
              <ButtonText>Zrob zdjecie</ButtonText>
            </Button>
            <Button onPress={handlePickImagesFromLibrary} action="secondary" variant="outline">
              <ButtonText>{imagePreviews.length ? 'Dodaj/zmien zdjecia z galerii' : 'Dodaj zdjecia z galerii'}</ButtonText>
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

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
            <ButtonText>{isSubmitting ? 'Wysylanie...' : 'Wyslij projekt'}</ButtonText>
          </Button>
          {submitError ? <ErrorState title="Nie udalo sie wyslac projektu" message={submitError} /> : null}
        </VStack>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
