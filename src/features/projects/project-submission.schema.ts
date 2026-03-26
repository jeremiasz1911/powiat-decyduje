import { z } from 'zod';

export const projectSubmissionSchema = z.object({
  title: z.string().min(3, 'Tytul musi miec minimum 3 znaki').max(100, 'Tytul jest za dlugi'),
  description: z
    .string()
    .min(20, 'Opis musi miec minimum 20 znakow')
    .max(2000, 'Opis jest za dlugi'),
  category: z.string().min(2, 'Wybierz kategorie projektu'),
  commune: z.string().min(2, 'Podaj gmine'),
  village: z.string().min(2, 'Podaj miejscowosc'),
  cost: z
    .string()
    .min(1, 'Podaj koszt')
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), 'Koszt musi byc poprawna liczba'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  imageUri: z.string().min(1, 'Dodaj zdjecie projektu'),
});

export type ProjectSubmissionFormValues = z.infer<typeof projectSubmissionSchema>;
