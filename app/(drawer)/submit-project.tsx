import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

import {
  projectSubmissionSchema,
  type ProjectSubmissionFormValues,
} from '@/src/features/projects/project-submission.schema';
import { createProject, ensureAnonymousAuth } from '@/src/services';

const CATEGORIES = ['Infrastruktura', 'Edukacja', 'Sport', 'Ekologia', 'Kultura'] as const;

export default function SubmitProjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();

  const initialLatitude = Number(params.latitude ?? 53.1126);
  const initialLongitude = Number(params.longitude ?? 20.3843);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      imageUri: '',
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

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Brak uprawnienia', 'Zezwol na dostep do galerii, aby dodac zdjecie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const uri = result.assets[0].uri;
    setImagePreview(uri);
    setValue('imageUri', uri, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: ProjectSubmissionFormValues) => {
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
        imageUri: values.imageUri,
      });

      Alert.alert('Projekt zapisany', `ID: ${projectId}\nKategoria: ${values.category}`);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nieznany blad zapisu projektu.';
      Alert.alert('Blad zapisu', message);
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
            <Text>Zdjecie projektu</Text>
            <Button onPress={handlePickImage} action="secondary" variant="outline">
              <ButtonText>{imagePreview ? 'Zmien zdjecie' : 'Dodaj zdjecie'}</ButtonText>
            </Button>
            {imagePreview ? <Image source={{ uri: imagePreview }} style={styles.preview} /> : null}
            {errors.imageUri ? <Text color="$error600">{errors.imageUri.message}</Text> : null}
          </VStack>

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
            <ButtonText>{isSubmitting ? 'Wysylanie...' : 'Wyslij projekt'}</ButtonText>
          </Button>
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
});
