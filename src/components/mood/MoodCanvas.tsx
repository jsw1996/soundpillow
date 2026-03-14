import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Grip, Image as ImageIcon, RotateCw } from 'lucide-react';
import { loadMoodHistory, MOOD_HISTORY_UPDATED_EVENT } from '../../utils/mood';
import { MOODS } from '../../data/moodMessages';
import type { MoodEntry, MoodLevel } from '../../types';
import { getDateString } from '../../utils/date';

type MoodCanvasItemType = 'note' | 'entry' | 'photo';

interface MoodCanvasItem {
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
}

type MoodCanvasFilter = 'all' | 'week' | 'month' | 'year';

type ActionState =
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

const MIN_SCALE = 0.65;
const MAX_SCALE = 2.2;

const INITIAL_ITEMS: MoodCanvasItem[] = [
  {
    id: 'note-1',
    type: 'note',
    x: 18,
    y: 24,
    r: -3,
    w: 170,
    h: 142,
    z: 1,
    color: '#FFFBE0',
    text: '今天的心情像薄云，慢慢散开。给自己一点耐心。',
  },
  {
    id: 'entry-1',
    type: 'entry',
    x: 130,
    y: 174,
    r: 2,
    w: 186,
    h: 170,
    z: 2,
    color: '#FFFDF2',
    title: '2026-03-13',
    text: '晚饭后散步十分钟，听雨声时心跳慢下来了。',
  },
  {
    id: 'photo-1',
    type: 'photo',
    x: 12,
    y: 246,
    r: -5,
    w: 124,
    h: 152,
    z: 3,
    color: '#FFFFFF',
    caption: 'Morning Light',
  },
];

const MOOD_CARD_COLORS = ['#FFFBE0', '#FFFDF2', '#FFF9E6', '#FFFFFF'];
const MOOD_EMOJI_BY_LEVEL = Object.fromEntries(MOODS.map((m) => [m.level, m.emoji])) as Record<MoodLevel, string>;
const MOOD_POLAROID_PREFIX = 'mood-polaroid-';
const MOOD_CANVAS_FILTERS: Array<{ value: MoodCanvasFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

function parseLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function isDateInFilter(date: string | undefined, filter: MoodCanvasFilter, now: Date): boolean {
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

function buildItemsFromMoodHistory(history: MoodEntry[]): MoodCanvasItem[] {
  if (history.length === 0) return INITIAL_ITEMS;
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
      x,
      y,
      r: rotation,
      w: 178,
      h: 228,
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

function mergeMoodItems(prev: MoodCanvasItem[], generated: MoodCanvasItem[]): MoodCanvasItem[] {
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

const PALETTE = {
  pageBg: '#F9F8F4',
  text: '#2D2D2D',
  accent: '#4a9e8e',
  line: 'rgba(0,0,0,0.03)',
  border: 'rgba(0,0,0,0.08)',
  softText: 'rgba(45,45,45,0.55)',
};

const angleFromPoint = (x: number, y: number, centerX: number, centerY: number) => {
  return (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
};

const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  return Math.hypot(a.x - b.x, a.y - b.y);
};

const midpointBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
};

const NOTE_PLACEHOLDER = '记录一个此刻的想法…';
const ENTRY_PLACEHOLDER = '写下一条今天的心情日志…';

const CANVAS_STORAGE_KEY = 'sleepyhub-mood-canvas';
const VIEWPORT_STORAGE_KEY = 'sleepyhub-mood-canvas-viewport';

function saveCanvasItems(items: MoodCanvasItem[]) {
  try {
    // Only persist non-mood items (notes/entries) and mood card positions
    const toSave = items.map(({ imageUrl, ...rest }) => rest);
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* quota exceeded — ignore */ }
}

function loadCanvasItems(): MoodCanvasItem[] | null {
  try {
    const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MoodCanvasItem[];
  } catch {
    return null;
  }
}

function saveViewport(offset: { x: number; y: number }, scale: number) {
  try {
    localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify({ x: offset.x, y: offset.y, scale }));
  } catch { /* ignore */ }
}

function loadViewport(): { x: number; y: number; scale: number } | null {
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
function initCanvasItems(): MoodCanvasItem[] {
  const moodItems = buildItemsFromMoodHistory(loadMoodHistory());
  const saved = loadCanvasItems();
  if (!saved) return moodItems;
  // Use saved items as the "prev" state, merge mood items on top
  return mergeMoodItems(saved, moodItems);
}

export function MoodCanvas() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const actionRef = useRef<ActionState | null>(null);
  const boardPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [items, setItems] = useState<MoodCanvasItem[]>(initCanvasItems);
  const [filter, setFilter] = useState<MoodCanvasFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftText, setDraftText] = useState('');
  const [viewportOffset, setViewportOffset] = useState(() => {
    const saved = loadViewport();
    return saved ? { x: saved.x, y: saved.y } : { x: 0, y: 0 };
  });
  const [viewportScale, setViewportScale] = useState(() => {
    const saved = loadViewport();
    return saved ? saved.scale : 1;
  });
  const lastTapRef = useRef<{ id: string; at: number } | null>(null);
  const focusRelayRef = useRef<HTMLTextAreaElement | null>(null);
  const editingRef = useRef<string | null>(null);
  // Timestamp when editing began — blur within a short window is iOS implicit blur (guard it)
  const editStartedAtRef = useRef(0);
  // How long to guard against iOS implicit blur after entering edit mode
  const BLUR_GUARD_MS = 400;

  // Persist items to localStorage whenever they change
  useEffect(() => {
    saveCanvasItems(items);
  }, [items]);

  // Persist viewport position/scale (debounced via the state settling)
  useEffect(() => {
    saveViewport(viewportOffset, viewportScale);
  }, [viewportOffset, viewportScale]);

  const bringToFront = useCallback((id: string) => {
    setItems((prev) => {
      const maxZ = prev.reduce((max, item) => Math.max(max, item.z), 0);
      return prev.map((item) => (item.id === id ? { ...item, z: maxZ + 1 } : item));
    });
  }, []);

  const updateItem = useCallback((id: string, updater: (item: MoodCanvasItem) => MoodCanvasItem) => {
    setItems((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingItemId) return;
    setItems((prev) => prev.map((item) => {
      if (item.id !== editingItemId) return item;
      if (item.type === 'note') return { ...item, text: draftText };
      if (item.type === 'entry') return { ...item, title: draftTitle, text: draftText };
      return item;
    }));
    setEditingItemId(null);
    editingRef.current = null;
  }, [draftText, draftTitle, editingItemId]);

  /**
   * iOS blur guard — only active for BLUR_GUARD_MS after entering edit mode.
   * Covers the iOS implicit blur caused by finger-lift (touchend on card div).
   * After the guard window, any blur is intentional → commit and exit editing.
   */
  const handleBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!editingRef.current) return;

    const elapsed = Date.now() - editStartedAtRef.current;
    if (elapsed < BLUR_GUARD_MS) {
      // iOS implicit blur right after entering edit — re-focus
      const el = event.target;
      setTimeout(() => {
        if (editingRef.current && document.activeElement !== el) {
          el.focus();
        }
      }, 10);
      return;
    }

    // Outside guard window → intentional blur (keyboard ✓, tap elsewhere, etc.)
    editingRef.current = null;
    commitEdit();
  }, [commitEdit]);

  /** Callback ref: transfer focus from relay → real textarea after React renders it */
  const editFocusRef = useCallback((el: HTMLTextAreaElement | HTMLInputElement | null) => {
    if (el) {
      setTimeout(() => {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }, 20);
    }
  }, []);

  const beginEdit = useCallback((item: MoodCanvasItem) => {
    if (item.type === 'photo') return;
    // Synchronously focus hidden relay so iOS opens the keyboard
    // (must happen in the user-gesture call stack)
    focusRelayRef.current?.focus();
    editStartedAtRef.current = Date.now();
    setSelectedId(item.id);
    setEditingItemId(item.id);
    editingRef.current = item.id;
    setDraftTitle(item.title ?? '');
    setDraftText(item.text ?? '');
  }, []);

  const addCanvasItem = useCallback((type: 'note' | 'entry') => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const boardRect = boardRef.current?.getBoundingClientRect();
    const boardCenterX = boardRect ? boardRect.width / 2 : 180;
    const boardCenterY = boardRect ? boardRect.height / 2 : 300;
    const worldCenterX = (boardCenterX - viewportOffset.x) / viewportScale;
    const worldCenterY = (boardCenterY - viewportOffset.y) / viewportScale;

    const base = type === 'note'
      ? {
          w: 176,
          h: 146,
          color: '#FFFBE0',
          text: '',
        }
      : {
          w: 196,
          h: 178,
          color: '#FFFDF2',
          title: getDateString(),
          text: '',
        };

    setItems((prev) => {
      const maxZ = prev.reduce((max, item) => Math.max(max, item.z), 0);
      const newItem: MoodCanvasItem = {
        id,
        type,
        x: worldCenterX - base.w / 2,
        y: worldCenterY - base.h / 2,
        r: type === 'note' ? -2 : 2,
        w: base.w,
        h: base.h,
        z: maxZ + 1,
        color: base.color,
        title: 'title' in base ? base.title : undefined,
        text: base.text,
      };
      return [...prev, newItem];
    });

    setSelectedId(id);
  }, [viewportOffset.x, viewportOffset.y, viewportScale]);

  const syncMoodCards = useCallback(() => {
    const generated = buildItemsFromMoodHistory(loadMoodHistory());
    setItems((prev) => mergeMoodItems(prev, generated));
  }, []);

  useEffect(() => {
    syncMoodCards();

    const onMoodUpdate = () => syncMoodCards();
    const onFocus = () => syncMoodCards();

    window.addEventListener(MOOD_HISTORY_UPDATED_EVENT, onMoodUpdate as EventListener);
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onMoodUpdate as EventListener);

    return () => {
      window.removeEventListener(MOOD_HISTORY_UPDATED_EVENT, onMoodUpdate as EventListener);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onMoodUpdate as EventListener);
    };
  }, [syncMoodCards]);

  const visibleItems = useMemo(() => {
    const now = new Date();
    return items.filter((item) => item.type !== 'photo' || isDateInFilter(item.date, filter, now));
  }, [filter, items]);

  const pointerToBoard = useCallback((event: PointerEvent | ReactPointerEvent) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const pointerToWorld = useCallback((event: PointerEvent | ReactPointerEvent) => {
    const p = pointerToBoard(event);
    return {
      x: (p.x - viewportOffset.x) / viewportScale,
      y: (p.y - viewportOffset.y) / viewportScale,
    };
  }, [pointerToBoard, viewportOffset.x, viewportOffset.y, viewportScale]);

  const startDrag = useCallback((event: ReactPointerEvent, item: MoodCanvasItem) => {
    event.preventDefault();
    event.stopPropagation();
    const point = pointerToWorld(event);
    actionRef.current = {
      mode: 'drag',
      itemId: item.id,
      startX: item.x,
      startY: item.y,
      pointerStartX: point.x,
      pointerStartY: point.y,
    };
  }, [pointerToWorld]);

  const startRotate = useCallback((event: ReactPointerEvent, item: MoodCanvasItem) => {
    event.stopPropagation();
    const p = pointerToWorld(event);
    const centerX = item.x + item.w / 2;
    const centerY = item.y + item.h / 2;
    actionRef.current = {
      mode: 'rotate',
      itemId: item.id,
      startR: item.r,
      centerX,
      centerY,
      pointerStartAngle: angleFromPoint(p.x, p.y, centerX, centerY),
    };
  }, [pointerToWorld]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (boardPointersRef.current.has(event.pointerId)) {
        boardPointersRef.current.set(event.pointerId, pointerToBoard(event));
      }

      if (!actionRef.current) return;
      const action = actionRef.current;

      if (action.mode === 'pan') {
        const point = pointerToBoard(event);
        const dx = point.x - action.pointerStartX;
        const dy = point.y - action.pointerStartY;
        setViewportOffset({ x: action.startOffsetX + dx, y: action.startOffsetY + dy });
        return;
      }

      if (action.mode === 'pinch') {
        const pA = boardPointersRef.current.get(action.pointerA);
        const pB = boardPointersRef.current.get(action.pointerB);
        if (!pA || !pB) return;

        const center = midpointBetween(pA, pB);
        const distance = Math.max(1, distanceBetween(pA, pB));
        const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, action.startScale * (distance / action.startDistance)));

        setViewportScale(nextScale);
        setViewportOffset({
          x: center.x - action.worldCenterX * nextScale,
          y: center.y - action.worldCenterY * nextScale,
        });
        return;
      }

      const point = pointerToWorld(event);

      if (action.mode === 'drag') {
        const dx = point.x - action.pointerStartX;
        const dy = point.y - action.pointerStartY;
        updateItem(action.itemId, (item) => ({ ...item, x: action.startX + dx, y: action.startY + dy }));
        return;
      }

      if (action.mode === 'rotate') {
        const angle = angleFromPoint(point.x, point.y, action.centerX, action.centerY);
        const delta = angle - action.pointerStartAngle;
        updateItem(action.itemId, (item) => ({ ...item, r: Math.round((action.startR + delta) * 10) / 10 }));
        return;
      }
    };

    const onUp = (event: PointerEvent) => {
      boardPointersRef.current.delete(event.pointerId);
      actionRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [pointerToBoard, pointerToWorld, updateItem]);

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: PALETTE.pageBg }}>
      {/* Hidden focus relay — gains focus synchronously on double-tap so iOS keeps the keyboard open
          while React re-renders to mount the real textarea. */}
      <textarea
        ref={focusRelayRef}
        aria-hidden
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none"
        style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1 }}
      />
      <div
        ref={boardRef}
        onPointerDown={(event) => {
          const hitCard = !!(event.target as HTMLElement).closest('[data-board-item]');
          if (!hitCard) {
            if (editingItemId) {
              editingRef.current = null;
              commitEdit();
            }
            setSelectedId(null);
          }

          // Don't start pan/pinch while editing
          if (editingItemId) return;

          const point = pointerToBoard(event);
          boardPointersRef.current.set(event.pointerId, point);

          if (boardPointersRef.current.size >= 2) {
            const [first, second] = Array.from(boardPointersRef.current.entries());
            const pA = first[1];
            const pB = second[1];
            const center = midpointBetween(pA, pB);
            const startDistance = Math.max(1, distanceBetween(pA, pB));

            actionRef.current = {
              mode: 'pinch',
              pointerA: first[0],
              pointerB: second[0],
              startScale: viewportScale,
              startDistance,
              worldCenterX: (center.x - viewportOffset.x) / viewportScale,
              worldCenterY: (center.y - viewportOffset.y) / viewportScale,
            };
            return;
          }

          actionRef.current = {
            mode: 'pan',
            startOffsetX: viewportOffset.x,
            startOffsetY: viewportOffset.y,
            pointerStartX: point.x,
            pointerStartY: point.y,
          };
        }}
        onPointerUp={(event) => {
          boardPointersRef.current.delete(event.pointerId);
          if (actionRef.current?.mode === 'pinch') {
            actionRef.current = null;
          }
        }}
        onPointerCancel={(event) => {
          boardPointersRef.current.delete(event.pointerId);
          if (actionRef.current?.mode === 'pinch') {
            actionRef.current = null;
          }
        }}
        className="relative h-full w-full overflow-hidden"
        style={{
          touchAction: 'none',
          backgroundColor: PALETTE.pageBg,
          backgroundImage:
            `linear-gradient(to right, ${PALETTE.line} 1px, transparent 1px), linear-gradient(to bottom, ${PALETTE.line} 1px, transparent 1px)`,
          backgroundSize: `${40 * viewportScale}px ${40 * viewportScale}px`,
          backgroundPosition: `${viewportOffset.x}px ${viewportOffset.y}px`,
        }}
      >
        <div
          className="absolute"
          style={{
            inset: 0,
            transformOrigin: '0 0',
            transform: `translate3d(${viewportOffset.x}px, ${viewportOffset.y}px, 0) scale(${viewportScale})`,
          }}
        >
          {visibleItems.map((item) => {
            const isSelected = item.id === selectedId;
            const isEditing = item.id === editingItemId;
            return (
              <div
                key={item.id}
                data-board-item="1"
                onPointerDown={(event) => {
                  setSelectedId(item.id);
                  bringToFront(item.id);

                  // If multiple fingers are down, this is a pinch gesture — not a double-tap
                  if (boardPointersRef.current.size >= 1) {
                    lastTapRef.current = null;
                    return;
                  }

                  const now = Date.now();
                  const lastTap = lastTapRef.current;
                  const dt = lastTap ? now - lastTap.at : -1;
                  if ((item.type === 'note' || item.type === 'entry') && lastTap && lastTap.id === item.id && dt < 500) {
                    event.stopPropagation();
                    event.preventDefault();
                    beginEdit(item);
                    lastTapRef.current = null;
                    return;
                  }
                  lastTapRef.current = { id: item.id, at: now };
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  beginEdit(item);
                }}
                className={`absolute transition-shadow ${item.type === 'photo' ? 'p-2 pb-7' : 'p-3'}`}
                style={{
                  touchAction: 'manipulation',
                  width: item.w,
                  height: item.h,
                  left: item.x,
                  top: item.y,
                  transform: `rotate(${item.r}deg)`,
                  zIndex: item.z,
                  border: isSelected ? '1.5px solid rgba(74,158,142,0.5)' : `1px solid ${PALETTE.border}`,
                  backgroundColor: item.color,
                  boxShadow: isSelected
                    ? '0 20px 40px rgba(0,0,0,0.15)'
                    : item.type === 'photo'
                      ? '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'
                      : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                }}
              >
                {item.type === 'note' && (
                  <>
                    <div className="h-0.5 w-8 mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                    {isEditing ? (
                      <textarea
                        ref={editFocusRef}
                        value={draftText}
                        onChange={(event) => setDraftText(event.target.value)}
                        onPointerDown={(event) => event.stopPropagation()}
                        onBlur={handleBlur}
                        placeholder={NOTE_PLACEHOLDER}
                        className="w-full h-[80%] bg-transparent text-xs leading-relaxed outline-none resize-none placeholder:text-black/25"
                        style={{ color: 'rgba(45,45,45,0.85)', caretColor: PALETTE.accent }}
                        autoFocus
                      />
                    ) : (
                      <p className="leading-relaxed text-xs" style={{ color: item.text ? 'rgba(45,45,45,0.85)' : 'rgba(0,0,0,0.25)' }}>
                        {item.text || NOTE_PLACEHOLDER}
                      </p>
                    )}
                  </>
                )}

                {item.type === 'entry' && (
                  <>
                    <div className="flex items-center justify-between mb-2 pb-1.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      {isEditing ? (
                        <input
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onPointerDown={(event) => event.stopPropagation()}
                          onBlur={handleBlur}
                          className="uppercase tracking-wider text-[10px] bg-transparent outline-none w-[85%]"
                          style={{ color: PALETTE.softText, caretColor: PALETTE.accent }}
                        />
                      ) : (
                        <span className="uppercase tracking-wider text-[10px]" style={{ color: PALETTE.softText }}>
                          {item.title}
                        </span>
                      )}
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PALETTE.accent }} />
                    </div>
                    {isEditing ? (
                      <textarea
                        ref={editFocusRef}
                        value={draftText}
                        onChange={(event) => setDraftText(event.target.value)}
                        onPointerDown={(event) => event.stopPropagation()}
                        onBlur={handleBlur}
                        placeholder={ENTRY_PLACEHOLDER}
                        className="w-full h-[78%] bg-transparent text-xs leading-relaxed outline-none resize-none placeholder:text-black/25"
                        style={{ color: 'rgba(45,45,45,0.86)', caretColor: PALETTE.accent }}
                        autoFocus
                      />
                    ) : (
                      <p className="leading-relaxed text-xs" style={{ color: item.text ? 'rgba(45,45,45,0.86)' : 'rgba(0,0,0,0.25)' }}>
                        {item.text || ENTRY_PLACEHOLDER}
                      </p>
                    )}
                  </>
                )}

                {item.type === 'photo' && (
                  <>
                    <div className="h-full w-full flex flex-col">
                      <div
                        className="relative w-full overflow-hidden"
                        style={{
                          backgroundColor: '#F1F0EB',
                          aspectRatio: '1 / 1',
                        }}
                      >
                        {item.imageUrl ? (
                          <>
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              aria-hidden
                              referrerPolicy="no-referrer"
                            />
                            <div
                              className="absolute inset-x-0 bottom-0 h-16"
                              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.36), transparent)' }}
                            />
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #d4a883 0%, #e8d5c4 55%, #c7bca5 100%)', opacity: 0.5 }} />
                            <div className="absolute inset-x-3 top-4 h-16 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(255,236,209,0.7)' }} />
                          </>
                        )}
                      </div>

                      <div className="pt-1">
                        <p className="text-center italic text-[10px]" style={{ color: PALETTE.softText }}>
                          {item.caption}
                        </p>
                        {item.text && (
                          <p
                            className="leading-snug text-center mt-0.5 text-[10px]"
                            style={{
                              color: 'rgba(45,45,45,0.82)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            “{item.text}”
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      editingRef.current = null;
                    }}
                    onClick={commitEdit}
                    className="absolute -top-3 right-0 px-2 py-0.5 border text-[9px] uppercase tracking-widest"
                    style={{ borderColor: 'rgba(74,158,142,0.6)', backgroundColor: '#FFFFFF', color: 'rgba(74,158,142,0.92)' }}
                  >
                    Done
                  </button>
                )}

                {isSelected && !isEditing && (
                  <>
                    <button
                      type="button"
                      onPointerDown={(event) => startDrag(event, item)}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest cursor-grab active:cursor-grabbing"
                      style={{ borderColor: 'rgba(74,158,142,0.6)', backgroundColor: '#FFFFFF', color: 'rgba(74,158,142,0.92)' }}
                      aria-label="Drag card"
                    >
                      Drag
                    </button>

                    <button
                      type="button"
                      onPointerDown={(event) => startRotate(event, item)}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(74,158,142,0.6)', backgroundColor: '#FFFFFF', color: PALETTE.accent }}
                      aria-label="Rotate"
                    >
                      <RotateCw size={11} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="absolute left-3 right-3 z-40 flex items-start gap-3"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <div className="flex flex-wrap gap-2">
            {MOOD_CANVAS_FILTERS.map((option) => {
              const isActive = option.value === filter;
              return (
                <button
                  key={option.value}
                  type="button"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={() => setFilter(option.value)}
                  className="px-2.5 py-1 text-[10px] uppercase tracking-widest border transition-colors"
                  style={{
                    borderColor: isActive ? 'rgba(74,158,142,0.32)' : 'rgba(0,0,0,0.25)',
                    backgroundColor: isActive ? 'rgba(230,244,240,0.92)' : 'rgba(255,255,255,0.68)',
                    color: isActive ? PALETTE.accent : 'rgba(45,45,45,0.78)',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="absolute bottom-24 right-3 rounded-lg border border-dashed px-2 py-1 text-[10px] flex items-center gap-1 z-40"
          style={{ borderColor: 'rgba(0,0,0,0.25)', color: PALETTE.softText, backgroundColor: 'rgba(255,255,255,0.3)' }}
        >
          <Grip size={10} />
          <RotateCw size={10} />
          <ImageIcon size={10} />
        </div>

        <div className="absolute bottom-24 left-3 z-40 flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={() => addCanvasItem('note')}
            className="px-2.5 py-1 text-[10px] uppercase tracking-widest border"
            style={{
              borderColor: 'rgba(0,0,0,0.25)',
              color: 'rgba(45,45,45,0.78)',
              backgroundColor: 'rgba(255,255,255,0.68)',
            }}
          >
            + Note
          </button>
          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={() => addCanvasItem('entry')}
            className="px-2.5 py-1 text-[10px] uppercase tracking-widest border"
            style={{
              borderColor: 'rgba(0,0,0,0.25)',
              color: 'rgba(45,45,45,0.78)',
              backgroundColor: 'rgba(255,255,255,0.68)',
            }}
          >
            + Entry
          </button>
        </div>
      </div>
    </div>
  );
}
