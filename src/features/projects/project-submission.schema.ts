import { z } from 'zod';
import { PROJECT_ICON_OPTIONS } from './project-icons';

const PROJECT_ICON_IDS = PROJECT_ICON_OPTIONS.map((option) => option.id);

export const projectSubmissionSchema = z.object({
  title: z.string().min(3, 'Tytul musi miec minimum 3 znaki').max(100, 'Tytul jest za dlugi'),
  description: z
    .string()
    .min(20, 'Opis musi miec minimum 20 znakow')
    .max(5000, 'Opis jest za dlugi'),
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
  imageUris: z
    .array(z.string().min(1))
    .min(1, 'Dodaj co najmniej jedno zdjecie projektu')
    .max(5, 'Mozesz dodac maksymalnie 5 zdjec'),
  icon: z
    .string()
    .refine((value) => PROJECT_ICON_IDS.includes(value), 'Wybierz ikonke projektu'),
});

export type ProjectSubmissionFormValues = z.infer<typeof projectSubmissionSchema>;
