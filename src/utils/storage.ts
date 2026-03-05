/** Load a value from localStorage with JSON parsing, returning defaultValue on any error */
export function loadFromStorage<T>(key: string, defaultValue: T, merge?: (stored: any) => T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return merge ? merge(parsed) : parsed;
    }
  } catch { /* corrupt or unavailable */ }
  return defaultValue;
}
