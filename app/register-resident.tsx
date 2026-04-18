import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  ButtonText,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  CheckIcon,
  Input,
  InputField,
  Text,
  VStack,
} from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import {
  residentRegistrationSchema,
  type ResidentRegistrationFormValues,
} from '@/src/features/auth/resident-registration.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { checkResidentRegistrationAvailability } from '@/src/services';

export default function RegisterResidentScreen() {
  const { notify } = useAppFeedback();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResidentRegistrationFormValues>({
    resolver: zodResolver(residentRegistrationSchema),
    defaultValues: {
      phoneNumber: '',
      pesel: '',
      acceptedRegulations: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ResidentRegistrationFormValues) => {
    const availability = await checkResidentRegistrationAvailability({
      phoneNumber: values.phoneNumber,
      pesel: values.pesel,
    });

    if (availability.phoneTaken) {
      await notify(
        'Numer zajety',
        'Ten numer telefonu jest juz przypisany do innego konta. Uzyj innego numeru lub zaloguj sie.',
        'error'
      );
      return;
    }

    if (availability.peselTaken) {
      await notify(
        'PESEL zajety',
        'Dla tego numeru PESEL istnieje juz konto mieszkanca. Skontaktuj sie z administratorem.',
        'error'
      );
      return;
    }

    await notify(
      'Dane poprawne',
      'Numer telefonu i PESEL sa wolne. Mozesz przejsc do kolejnego kroku rejestracji.',
      'success'
    );
  };

  return (
    <ScreenContainer title="Rejestracja mieszkanca" description="Uzupelnij dane, aby kontynuowac.">
      <Box>
        <VStack space="md">
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Numer telefonu</Text>
                <Input>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    placeholder="+48 500 600 700"
                  />
                </Input>
                {errors.phoneNumber ? <Text color="$error600">{errors.phoneNumber.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="pesel"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>PESEL</Text>
                <Input>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    maxLength={11}
                    autoComplete="off"
                    placeholder="00000000000"
                  />
                </Input>
                {errors.pesel ? <Text color="$error600">{errors.pesel.message}</Text> : null}
              </VStack>
            )}
          />

          <Controller
            control={control}
            name="acceptedRegulations"
            render={({ field: { onChange, value } }) => (
              <VStack space="xs">
                <Checkbox value="accepted" isChecked={Boolean(value)} onChange={onChange}>
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel>Akceptuje regulamin</CheckboxLabel>
                </Checkbox>
                {errors.acceptedRegulations ? (
                  <Text color="$error600">{errors.acceptedRegulations.message}</Text>
                ) : null}
              </VStack>
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
            <ButtonText>{isSubmitting ? 'Zapisywanie...' : 'Kontynuuj'}</ButtonText>
          </Button>
        </VStack>
      </Box>
    </ScreenContainer>
  );
}
