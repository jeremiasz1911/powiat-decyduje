export const PROJECT_CATEGORIES = [
  'Infrastruktura',
  'Edukacja',
  'Sport',
  'Ekologia',
  'Kultura',
  'Inne',
] as const;

export const PROJECT_COMMUNES = [
  'Mlawa',
  'Lipowiec Koscielny',
  'Szydlowo',
  'Wieczfnia Koscielna',
] as const;

export const ALL_CATEGORIES_LABEL = 'Wszystkie kategorie';
export const ALL_COMMUNES_LABEL = 'Wszystkie gminy';

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  submitted: 'Zlozony',
  pending: 'Oczekuje',
  review: 'W weryfikacji',
  approved: 'Zaakceptowany',
  rejected: 'Odrzucony',
  voting: 'W glosowaniu',
  active: 'Aktywny',
  completed: 'Zrealizowany',
};
