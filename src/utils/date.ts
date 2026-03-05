/** Returns a date as YYYY-MM-DD string */
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/** Returns yesterday's date as YYYY-MM-DD string */
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateString(d);
}

/** Returns a localized long date label (e.g. "March 5, 2026") */
export function formatDateLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
