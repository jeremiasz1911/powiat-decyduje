import { Box, Button, ButtonText, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(3, 'Tytul musi miec min. 3 znaki'),
  description: z.string().min(10, 'Opis musi miec min. 10 znakow'),
});

type IssueFormValues = z.infer<typeof issueSchema>;

export default function HomeScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = (values: IssueFormValues) => {
    console.log('Issue draft:', values);
  };

  return (
    <Box flex={1} px="$4" py="$8" bg="$backgroundLight0">
      <VStack space="md">
        <Heading size="lg">Powiat Decyduje</Heading>
        <Text color="$textLight600">Zglos problem w swojej okolicy.</Text>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <VStack space="xs">
              <Input>
                <InputField
                  placeholder="Tytul zgloszenia"
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
              <Input>
                <InputField
                  placeholder="Opis"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              </Input>
              {errors.description ? <Text color="$error600">{errors.description.message}</Text> : null}
            </VStack>
          )}
        />

        <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
          <ButtonText>Wyslij</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
