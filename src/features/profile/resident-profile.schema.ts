import { z } from 'zod';

export const residentProfileSchema = z.object({
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
  acceptedRegulations: z.boolean().refine((value) => value, {
    message: 'Musisz zaakceptowac oswiadczenie mieszkanca.',
  }),
});

export type ResidentProfileFormValues = z.infer<typeof residentProfileSchema>;
