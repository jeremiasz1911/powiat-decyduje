import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Box, Button, ButtonText, Input, InputField, Text, VStack } from '@gluestack-ui/themed';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import {
  confirmResidentPhoneLoginCode,
  confirmResidentPhoneVerificationCode,
  sendResidentPhoneVerificationCode,
} from '@/src/services';

const smsCodeSchema = z.object({
  smsCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Kod SMS musi miec dokladnie 6 cyfr.'),
});

type SmsCodeFormValues = z.infer<typeof smsCodeSchema>;

export default function VerifyResidentPhoneScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const params = useLocalSearchParams<{
    mode?: string;
    phoneNumber?: string;
    verificationId?: string;
    pesel?: string;
  }>();
  const [currentVerificationId, setCurrentVerificationId] = useState(params.verificationId ?? '');
  const [isResending, setIsResending] = useState(false);

  const mode = useMemo(() => params.mode ?? 'register', [params.mode]);
  const phoneNumber = useMemo(() => params.phoneNumber ?? '', [params.phoneNumber]);
  const pesel = useMemo(() => params.pesel ?? '', [params.pesel]);
  const isRegisterMode = mode === 'register';
  const isRecoverMode = mode === 'recover';
  const canProceed = Boolean(phoneNumber && currentVerificationId && (!isRegisterMode || pesel));

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SmsCodeFormValues>({
    resolver: zodResolver(smsCodeSchema),
    defaultValues: { smsCode: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: SmsCodeFormValues) => {
    if (!canProceed) {
      await notify(
        'Brak danych weryfikacji',
        'Brakuje numeru telefonu lub identyfikatora weryfikacji. Wroc do poprzedniego kroku.',
        'error'
      );
      return;
    }

    try {
      if (isRegisterMode) {
        await confirmResidentPhoneVerificationCode({
          verificationId: currentVerificationId,
          smsCode: values.smsCode,
          phoneNumber,
          pesel,
        });

        await notify('Rejestracja zakonczona', 'Numer telefonu zostal potwierdzony. Mozesz korzystac z aplikacji.', 'success');
      } else {
        await confirmResidentPhoneLoginCode({
          verificationId: currentVerificationId,
          smsCode: values.smsCode,
          phoneNumber,
        });

        if (isRecoverMode) {
          await notify('Dostep odzyskany', 'Kod SMS zostal potwierdzony. Odzyskales dostep do konta.', 'success');
        } else {
          await notify('Zalogowano', 'Zalogowano numerem telefonu po potwierdzeniu kodu SMS.', 'success');
        }
      }

      router.replace('/(drawer)/(tabs)/projects');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie potwierdzic kodu SMS.';
      await notify('Blad weryfikacji', message, 'error');
    }
  };

  const handleResendCode = async () => {
    if (!phoneNumber) {
      await notify('Brak numeru', 'Nie mozna ponowic wysylki bez numeru telefonu.', 'error');
      return;
    }

    setIsResending(true);

    try {
      const verification = await sendResidentPhoneVerificationCode({ phoneNumber });
      setCurrentVerificationId(verification.verificationId);
      await notify('Kod wyslany ponownie', `Nowy kod wyslano na ${verification.normalizedPhoneNumber}.`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie wyslac kodu ponownie.';
      await notify('Blad wysylki', message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScreenContainer
      title="Potwierdz kod SMS"
      description="Wpisz kod SMS wyslany na Twoj numer telefonu, aby sie zalogowac lub odzyskac dostep.">
      <Box>
        <VStack space="md">
          <Text>Numer telefonu: {phoneNumber || '-'}</Text>

          <Controller
            control={control}
            name="smsCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <VStack space="xs">
                <Text>Kod SMS</Text>
                <Input>
                  <InputField
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </Input>
                {errors.smsCode ? <Text color="$error600">{errors.smsCode.message}</Text> : null}
              </VStack>
            )}
          />

          <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting || !canProceed}>
            <ButtonText>{isSubmitting ? 'Potwierdzanie kodu SMS...' : 'Potwierdz kod SMS'}</ButtonText>
          </Button>

          <Button variant="outline" action="secondary" onPress={handleResendCode} isDisabled={isResending}>
            <ButtonText>{isResending ? 'Wysylanie kodu SMS...' : 'Wyslij kod SMS ponownie'}</ButtonText>
          </Button>
        </VStack>
      </Box>
    </ScreenContainer>
  );
}
