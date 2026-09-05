export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Rotary Year runs 1 July to 30 June; ryYear is the integer of the July it started in.
export function ryYearOf(date: Date): number {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return month >= 7 ? year : year - 1;
}

// Clubs report on the month that just finished, so the open reporting month is always the previous calendar month.
export function currentReportMonth(now: Date = new Date()): string {
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return monthKey(first);
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const label = MONTH_LABELS[(month ?? 1) - 1] ?? key;
  return `${label} ${year}`;
}

export function currentRyYear(now: Date = new Date()): number {
  return ryYearOf(now);
}
