import { useMemo } from 'react';

import { DigitCodeInput } from '@/src/components/ui/DigitCodeInput';
import { isValidPeselChecksum } from '@/src/features/auth/resident-registration.schema';

const PESEL_LENGTH = 11;

type PeselInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
};

export function PeselInput({
  value,
  onChange,
  onBlur,
  error,
  label = 'PESEL',
}: PeselInputProps) {
  const normalized = value.replace(/\D/g, '').slice(0, PESEL_LENGTH);
  const isComplete = normalized.length === PESEL_LENGTH;
  const isChecksumValid = useMemo(
    () => (isComplete ? isValidPeselChecksum(normalized) : false),
    [isComplete, normalized]
  );

  return (
    <DigitCodeInput
      length={PESEL_LENGTH}
      value={normalized}
      onChange={onChange}
      onBlur={onBlur}
      label={label}
      error={error}
      helperText={
        !error && !isComplete
          ? 'Wpisz 11 cyfr numeru PESEL. Ostatnia cyfra to suma kontrolna.'
          : undefined
      }
      successText={
        !error && isComplete && isChecksumValid ? 'Numer PESEL wygląda poprawnie.' : undefined
      }
    />
  );
}
