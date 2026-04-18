import { z } from 'zod';

const normalizePhone = (value: string) => value.replace(/[\s-]/g, '');

function isValidPhoneNumber(value: string): boolean {
  return /^(?:\+48)?\d{9}$/.test(normalizePhone(value));
}

function isValidPeselChecksum(pesel: string): boolean {
  if (!/^\d{11}$/.test(pesel)) {
    return false;
  }

  const digits = pesel.split('').map(Number);
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = weights.reduce((acc, weight, index) => acc + weight * digits[index], 0);
  const checksum = (10 - (sum % 10)) % 10;

  return checksum === digits[10];
}

export const residentRegistrationSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Numer telefonu jest wymagany.')
    .refine(isValidPhoneNumber, 'Podaj poprawny numer telefonu (np. +48500100200).'),
  pesel: z
    .string()
    .trim()
    .min(1, 'PESEL jest wymagany.')
    .regex(/^\d{11}$/, 'PESEL musi miec dokladnie 11 cyfr.')
    .refine(isValidPeselChecksum, 'Niepoprawny PESEL (blad sumy kontrolnej).'),
  acceptedRegulations: z.boolean().refine((value) => value, {
    message: 'Musisz zaakceptowac regulamin.',
  }),
});

export type ResidentRegistrationFormValues = z.infer<typeof residentRegistrationSchema>;
