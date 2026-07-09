import { z } from 'zod';
import { isProjectIconId, type ProjectIconId } from './project-icons';
import { isProjectMarkerColor } from './project-marker-colors';

export const projectSubmissionSchema = z.object({
  title: z.string().min(3, 'Tytul musi miec minimum 3 znaki').max(100, 'Tytul jest za dlugi'),
  description: z
    .string()
    .min(20, 'Opis musi miec minimum 20 znakow')
    .max(5000, 'Opis jest za dlugi'),
  category: z.string().min(2, 'Wybierz kategorie projektu'),
  locationLabel: z.string().max(140, 'Adres lub nazwa miejsca jest za dluga'),
  commune: z.string().min(2, 'Podaj gmine'),
  village: z.string().min(2, 'Podaj miejscowosc'),
  cost: z
    .string()
    .refine(
      (value) => value.trim() === '' || /^\d+(\.\d{1,2})?$/.test(value.trim()),
      'Koszt musi byc poprawna liczba'
    ),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  imageUris: z
    .array(z.string().min(1))
    .min(1, 'Dodaj co najmniej jedno zdjecie projektu')
    .max(5, 'Mozesz dodac maksymalnie 5 zdjec'),
  icon: z.custom<ProjectIconId>(
    (value) => typeof value === 'string' && isProjectIconId(value),
    'Wybierz ikonke projektu'
  ),
  markerColor: z.custom<string>(
    (value) => typeof value === 'string' && isProjectMarkerColor(value),
    'Wybierz kolor pinezki'
  ),
});

export type ProjectSubmissionFormValues = z.infer<typeof projectSubmissionSchema>;
