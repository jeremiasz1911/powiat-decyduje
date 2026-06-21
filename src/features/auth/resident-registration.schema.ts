import { z } from 'zod';

export const COUNTY_NAME = 'powiat mławski';
export const COMMUNE_NAME = 'Mława';

export function normalizePhoneInput(value: string): string {
  const compact = value.replace(/[\s-]/g, '');

  if (/^\d{9}$/.test(compact)) {
    return `+48${compact}`;
  }

  if (/^48\d{9}$/.test(compact)) {
    return `+${compact}`;
  }

  return compact;
}

export function normalizePeselInput(value: string): string {
  return value.trim();
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

const normalizedPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Wpisz numer telefonu.')
  .refine((value) => /^(?:\+48)?\d{9}$/.test(normalizePhoneInput(value)), 'Wpisz poprawny numer telefonu.');

const peselSchema = z
  .string()
  .trim()
  .min(1, 'Wpisz numer PESEL.')
  .regex(/^\d{11}$/, 'PESEL musi miec 11 cyfr.')
  .refine(isValidPeselChecksum, 'Wpisany PESEL jest niepoprawny.');

const emailSchema = z.string().trim().email('Wpisz poprawny adres e-mail.');

const consentSchema = z
  .boolean()
  .refine((value) => value, 'Musisz zaznaczyc te zgode.');

export const residentRegistrationSchema = z.object({
  phoneNumber: normalizedPhoneSchema,
  pesel: peselSchema,
  email: emailSchema,
  password: z.string().min(8, 'Haslo musi miec co najmniej 8 znakow.'),
  firstName: z.string().trim().min(2, 'Wpisz imie.'),
  lastName: z.string().trim().min(2, 'Wpisz nazwisko.'),
  address: z.object({
    street: z.string().trim().min(2, 'Wpisz ulicę.'),
    houseNumber: z.string().trim().min(1, 'Wpisz numer domu lub lokalu.'),
    apartmentNumber: z.string().trim().optional().or(z.literal('')),
    postalCode: z.string().trim().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi miec format XX-XXX.'),
    city: z.string().trim().min(2, 'Wpisz miejscowość.'),
    commune: z.string().trim().min(2, 'Wpisz gminę.'),
  }),
  residentDeclaration: consentSchema,
  termsAccepted: consentSchema,
  privacyPolicyAccepted: consentSchema,
  personalDataProcessingAccepted: consentSchema,
});

export type ResidentRegistrationFormValues = z.infer<typeof residentRegistrationSchema>;

export const residentLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Wpisz email lub numer telefonu.')
    .superRefine((value, ctx) => {
      if (value.includes('@')) {
        if (!z.string().email().safeParse(value).success) {
          ctx.addIssue({
            code: 'custom',
            message: 'Wpisz poprawny adres e-mail.',
          });
        }
        return;
      }

      if (!/^(?:\+48)?\d{9}$/.test(normalizePhoneInput(value))) {
        ctx.addIssue({
          code: 'custom',
          message: 'Wpisz poprawny numer telefonu.',
        });
      }
    }),
  password: z.string().min(8, 'Haslo musi miec co najmniej 8 znakow.'),
});

export type ResidentLoginFormValues = z.infer<typeof residentLoginSchema>;

export const passwordResetSchema = z.object({
  phoneNumber: normalizedPhoneSchema,
});

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export const passwordResetConfirmSchema = z
  .object({
    smsCode: z.string().trim().regex(/^\d{6}$/, 'Kod SMS musi miec 6 cyfr.'),
    newPassword: z.string().min(8, 'Haslo musi miec co najmniej 8 znakow.'),
    confirmPassword: z.string().min(8, 'Haslo musi miec co najmniej 8 znakow.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hasla musza byc takie same.',
    path: ['confirmPassword'],
  });

export type PasswordResetConfirmFormValues = z.infer<typeof passwordResetConfirmSchema>;
