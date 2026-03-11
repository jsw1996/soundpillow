import { useCallback } from 'react';

/**
 * Provides next/prev navigation over an array with wraparound.
 * Returns stable callbacks for skipping forward and backward.
 */
export function useCircularNavigation<T>(
  items: T[],
  currentId: string | null,
  getId: (item: T) => string,
  onSelect: (item: T) => void,
) {
  const skipNext = useCallback(() => {
    if (items.length === 0) return;
    const idx = currentId ? items.findIndex((item) => getId(item) === currentId) : -1;
    const next = idx === -1 ? items[0] : items[(idx + 1) % items.length];
    onSelect(next);
  }, [items, currentId, getId, onSelect]);

  const skipPrev = useCallback(() => {
    if (items.length === 0) return;
    const idx = currentId ? items.findIndex((item) => getId(item) === currentId) : -1;
    const prev = idx === -1 ? items[items.length - 1] : items[(idx - 1 + items.length) % items.length];
    onSelect(prev);
  }, [items, currentId, getId, onSelect]);

  return { skipNext, skipPrev };
}
