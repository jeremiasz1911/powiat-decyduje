import { useState } from 'react';
import { useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Box,
  Button,
  ButtonText,
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
import { sendResidentPhoneVerificationCode } from '@/src/services';

type RecoverAccessFormValues = Pick<ResidentRegistrationFormValues, 'phoneNumber'>;

export default function RecoverAccessPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const [isSendingCode, setIsSendingCode] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverAccessFormValues>({
    resolver: zodResolver(residentRegistrationSchema.pick({ phoneNumber: true })),
    defaultValues: {
      phoneNumber: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: RecoverAccessFormValues) => {
    setIsSendingCode(true);

    try {
      const verification = await sendResidentPhoneVerificationCode({
        phoneNumber: values.phoneNumber,
      });

      await notify('Kod wyslany', `Wyslalismy SMS na numer ${verification.normalizedPhoneNumber}.`, 'success');

      router.push({
        pathname: '/verify-resident-phone',
        params: {
          mode: 'recover',
          phoneNumber: verification.normalizedPhoneNumber,
          verificationId: verification.verificationId,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie wyslac kodu SMS.';
      await notify('Blad odzyskiwania dostepu przez SMS', message, 'error');
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <ScreenContainer
      title="Odzyskaj dostep przez SMS"
      description="Podaj numer telefonu, aby otrzymac kod SMS i odzyskac dostep do konta.">
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

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSendingCode}>
            <ButtonText>{isSendingCode ? 'Wysylanie kodu SMS...' : 'Wyslij kod SMS'}</ButtonText>
          </Button>
        </VStack>
      </Box>
    </ScreenContainer>
  );
}
