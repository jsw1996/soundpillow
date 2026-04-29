import { loadMoodHistory } from '../../utils/mood';
import type { MoodCanvasItem } from './canvasTypes';
import { MOOD_POLAROID_PREFIX, buildInitialItems, buildItemsFromMoodHistory, mergeMoodItems } from './canvasTypes';

const CANVAS_STORAGE_KEY = 'sleepyhub-mood-canvas';
const VIEWPORT_STORAGE_KEY = 'sleepyhub-mood-canvas-viewport';
const DELETED_IDS_STORAGE_KEY = 'sleepyhub-mood-canvas-deleted';
export const CANVAS_ITEMS_UPDATED_EVENT = 'sleepyhub:mood-canvas-items-updated';

function notifyCanvasItemsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CANVAS_ITEMS_UPDATED_EVENT));
  }
}

export function saveCanvasItems(items: MoodCanvasItem[]): void {
  try {
    // Persist non-mood items fully; strip derived imageUrl from mood polaroids.
    const toSave = items.map((item) => {
      if (item.type === 'photo' && item.id.startsWith(MOOD_POLAROID_PREFIX)) {
        const { imageUrl, ...rest } = item;
        return rest;
      }
      return item;
    });
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(toSave));
    notifyCanvasItemsUpdated();
  } catch { /* quota exceeded — ignore */ }
}

export function loadCanvasItems(): MoodCanvasItem[] | null {
  try {
    const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MoodCanvasItem[];
  } catch {
    return null;
  }
}

export function loadDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveDeletedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify([...ids]));
    notifyCanvasItemsUpdated();
  } catch { /* ignore */ }
}

export function saveViewport(offset: { x: number; y: number }, scale: number): void {
  try {
    localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify({ x: offset.x, y: offset.y, scale }));
  } catch { /* ignore */ }
}

export function loadViewport(): { x: number; y: number; scale: number } | null {
  try {
    const raw = localStorage.getItem(VIEWPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Initialize canvas items: load saved items from localStorage, then merge
 * with freshly generated mood polaroids (to pick up new mood entries or
 * updated images).
 */
export function initCanvasItems(t: (key: any) => string): MoodCanvasItem[] {
  const deleted = loadDeletedIds();
  const moodItems = buildItemsFromMoodHistory(loadMoodHistory()).filter((i: MoodCanvasItem) => !deleted.has(i.id));
  const saved = loadCanvasItems();
  if (!saved) {
    if (moodItems.length > 0) return moodItems;
    return buildInitialItems(t).filter((i) => !deleted.has(i.id));
  }
  const merged = mergeMoodItems(saved, moodItems);
  return merged.filter((i) => !deleted.has(i.id));
}
