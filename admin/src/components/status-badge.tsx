const STATUS_LABELS: Record<string, string> = {
  submitted: 'Zgłoszony',
  approved: 'Zaakceptowany',
  rejected: 'Odrzucony',
};

const STATUS_CLASSES: Record<string, string> = {
  submitted: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        STATUS_CLASSES[status] ?? 'bg-slate-100 text-slate-700'
      }`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
