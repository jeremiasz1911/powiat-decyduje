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
  submitted: 'Zgłoszony',
  approved: 'Zaakceptowany',
  rejected: 'Odrzucony',
  // Legacy aliases (migration / old records)
  pending: 'Zgłoszony',
  review: 'Zgłoszony',
  zgloszony: 'Zgłoszony',
  voting: 'Zaakceptowany',
  active: 'Zaakceptowany',
  completed: 'Zaakceptowany',
};
