/** Returns a local calendar date as YYYY-MM-DD */
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
