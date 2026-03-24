/**
 * Retry an async function with exponential backoff.
 * Used by AppContext to load tracks, stories, and mixes.
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, label = 'request' }: { retries?: number; label?: string } = {},
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`${label} failed (attempt ${attempt + 1}/${retries}):`, error);
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Unreachable');
}
