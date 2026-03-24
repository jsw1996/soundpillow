import { MOODS } from '../../data/moodMessages';
import type { MoodEntry, MoodLevel } from '../../types';

export type MoodCanvasItemType = 'note' | 'entry' | 'photo' | 'sticker';

export interface MoodCanvasItem {
  id: string;
  type: MoodCanvasItemType;
  x: number;
  y: number;
  r: number;
  w: number;
  h: number;
  z: number;
  title?: string;
  text?: string;
  caption?: string;
  color?: string;
  imageUrl?: string;
  moodEmoji?: string;
  date?: string;
  stickerCategory?: string;
}

export type MoodCanvasFilter = 'all' | 'week' | 'month' | 'year';

export type ActionState =
  | {
      mode: 'pan';
      startOffsetX: number;
      startOffsetY: number;
      pointerStartX: number;
      pointerStartY: number;
    }
  | {
      mode: 'pinch';
      pointerA: number;
      pointerB: number;
      startScale: number;
      startDistance: number;
      worldCenterX: number;
      worldCenterY: number;
    }
  | {
      mode: 'drag';
      itemId: string;
      startX: number;
      startY: number;
      pointerStartX: number;
      pointerStartY: number;
    }
  | {
      mode: 'rotate';
      itemId: string;
      startR: number;
      centerX: number;
      centerY: number;
      pointerStartAngle: number;
    };

export const MIN_SCALE = 0.65;
export const MAX_SCALE = 2.2;

export const MOOD_POLAROID_PREFIX = 'mood-polaroid-';

export const LIGHT_MOOD_CARD_COLORS = ['#FFFBE0', '#FFFDF2', '#FFF9E6', '#FFFFFF'] as const;
export const DARK_MOOD_CARD_COLORS = ['#3C3427', '#332D25', '#3A3125', '#232734'] as const;

export const MOOD_EMOJI_BY_LEVEL = Object.fromEntries(MOODS.map((m) => [m.level, m.emoji])) as Record<MoodLevel, string>;

export const MOOD_CANVAS_FILTER_KEYS: Array<{ value: MoodCanvasFilter; key: string }> = [
  { value: 'all', key: 'canvasFilterAll' },
  { value: 'week', key: 'canvasFilterWeek' },
  { value: 'month', key: 'canvasFilterMonth' },
  { value: 'year', key: 'canvasFilterYear' },
];

// ── Geometry helpers ──

export const angleFromPoint = (x: number, y: number, centerX: number, centerY: number) =>
  (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;

export const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const midpointBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

// ── Date filtering ──

function parseLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function isDateInFilter(date: string | undefined, filter: MoodCanvasFilter, now: Date): boolean {
  if (!date || filter === 'all') return true;

  const target = parseLocalDateString(date);
  if (!target) return false;

  if (filter === 'year') {
    return target.getFullYear() === now.getFullYear();
  }

  if (filter === 'month') {
    return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth();
  }

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return target >= startOfWeek && target < endOfWeek;
}

// ── Mood history → canvas items ──

export function buildInitialItems(t: (key: any) => string): MoodCanvasItem[] {
  return [
    {
      id: 'note-1',
      type: 'note',
      x: 18, y: 24, r: -3, w: 170, h: 142, z: 1,
      color: '#FFFBE0',
      text: t('canvasDemoNote'),
    },
    {
      id: 'entry-1',
      type: 'entry',
      x: 130, y: 174, r: 2, w: 186, h: 170, z: 2,
      color: '#FFFDF2',
      title: '2026-03-13',
      text: t('canvasDemoEntry'),
    },
    {
      id: 'photo-1',
      type: 'photo',
      x: 12, y: 246, r: -5, w: 124, h: 152, z: 3,
      color: '#FFFFFF',
      caption: t('canvasDemoCaption'),
    },
  ];
}

export function buildItemsFromMoodHistory(history: MoodEntry[]): MoodCanvasItem[] {
  if (history.length === 0) return [];
  const ascHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

  return ascHistory.map((entry, index) => {
    const config = MOODS.find((m) => m.level === entry.mood);
    const emoji = MOOD_EMOJI_BY_LEVEL[entry.mood] ?? '🙂';
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 26 + column * 196;
    const y = 24 + row * 246;
    const rotation = [-4, 3, -2, 2, -3, 1][index % 6] ?? 0;

    return {
      id: `${MOOD_POLAROID_PREFIX}${entry.date}`,
      type: 'photo',
      date: entry.date,
      x, y,
      r: rotation,
      w: 178, h: 228,
      z: index + 1,
      color: '#FFFFFF',
      imageUrl: config?.imageUrl,
      moodEmoji: emoji,
      caption: `${entry.date} · ${emoji}`,
      title: `${entry.date} · ${emoji}`,
      text: entry.message,
    } satisfies MoodCanvasItem;
  });
}

export function mergeMoodItems(prev: MoodCanvasItem[], generated: MoodCanvasItem[]): MoodCanvasItem[] {
  if (generated.length === 0) return prev;

  const prevMap = new Map(prev.map((item) => [item.id, item]));
  const nonMoodItems = prev.filter((item) => !item.id.startsWith(MOOD_POLAROID_PREFIX));
  let maxZ = prev.reduce((max, item) => Math.max(max, item.z), 0);

  const mergedMoodItems = generated.map((item) => {
    const existing = prevMap.get(item.id);
    if (!existing) {
      maxZ += 1;
      return { ...item, z: maxZ };
    }
    return {
      ...existing,
      imageUrl: item.imageUrl,
      moodEmoji: item.moodEmoji,
      caption: item.caption,
      title: item.title,
      text: item.text,
      color: item.color,
      date: item.date,
    };
  });

  return [...nonMoodItems, ...mergedMoodItems];
}
