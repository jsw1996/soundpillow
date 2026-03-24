import { useEffect } from 'react';

/** Sync a state value to localStorage as JSON whenever it changes. */
export function useLocalStorageSync(key: string, value: unknown): void {
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
}
