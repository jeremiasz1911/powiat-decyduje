import { z } from 'zod';

export const residentProfileEditSchema = z.object({
  fullName: z.string().trim().min(3, 'Podaj imie i nazwisko.'),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || z.string().email().safeParse(value).success, 'Niepoprawny email.'),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || value.length >= 9, 'Numer telefonu jest za krotki.'),
  village: z.string().trim().min(2, 'Podaj miejscowosc.'),
  street: z.string().trim().optional().or(z.literal('')),
});

export type ResidentProfileEditValues = z.infer<typeof residentProfileEditSchema>;

/** @deprecated Use residentProfileEditSchema — declaration belongs to registration only. */
export const residentProfileSchema = residentProfileEditSchema;

/** @deprecated Use ResidentProfileEditValues */
export type ResidentProfileFormValues = ResidentProfileEditValues;
