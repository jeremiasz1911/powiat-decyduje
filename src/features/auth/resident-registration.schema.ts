import { z } from 'zod';

export const residentRegistrationSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(9, 'Podaj poprawny numer telefonu.'),
  pesel: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'PESEL musi miec dokladnie 11 cyfr.'),
  acceptedRegulations: z.boolean().refine((value) => value, {
    message: 'Musisz zaakceptowac regulamin.',
  }),
});

export type ResidentRegistrationFormValues = z.infer<typeof residentRegistrationSchema>;
