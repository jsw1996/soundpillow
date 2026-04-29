import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadMoodHistory, MOOD_HISTORY_UPDATED_EVENT } from '../../utils/mood';
import { STICKER_CATALOG, type StickerDefinition } from '../../data/stickerCatalog';
import { getDateString } from '../../utils/date';
import { useTranslation } from '../../i18n';
import { useAppContext } from '../../context/AppContext';

import type { MoodCanvasItem, MoodCanvasFilter, ActionState } from './canvasTypes';
import {
  MIN_SCALE, MAX_SCALE,
  MOOD_CANVAS_FILTER_KEYS,
  LIGHT_MOOD_CARD_COLORS, DARK_MOOD_CARD_COLORS,
  angleFromPoint, distanceBetween, midpointBetween,
  isDateInFilter, buildItemsFromMoodHistory, mergeMoodItems,
} from './canvasTypes';
import { LIGHT_PALETTE, DARK_PALETTE } from './canvasTheme';
import {
  saveCanvasItems, loadDeletedIds, saveDeletedIds,
  saveViewport, loadViewport, initCanvasItems,
} from './canvasStorage';
import { StickerDrawer } from './StickerDrawer';
import { CanvasItemView } from './CanvasItemView';

interface MoodCanvasProps {
  focusDate?: string;
  onBack?: () => void;
}

export function MoodCanvas({ focusDate, onBack }: MoodCanvasProps = {}) {
  const { t } = useTranslation();
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';
  const palette = useMemo(() => (isDark ? DARK_PALETTE : LIGHT_PALETTE), [isDark]);
  const cardColors = useMemo(() => (isDark ? DARK_MOOD_CARD_COLORS : LIGHT_MOOD_CARD_COLORS), [isDark]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const actionRef = useRef<ActionState | null>(null);
  const boardPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [items, setItems] = useState<MoodCanvasItem[]>(() => initCanvasItems(t));
  const [filter, setFilter] = useState<MoodCanvasFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isStickerDrawerOpen, setIsStickerDrawerOpen] = useState(false);
  const [activeStickerCategoryId, setActiveStickerCategoryId] = useState<string>(STICKER_CATALOG[0]?.id ?? '');
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
  const editStartedAtRef = useRef(0);
  const centeredFocusDateRef = useRef<string | null>(null);
  const BLUR_GUARD_MS = 400;

  // ── Persistence ──

  useEffect(() => { saveCanvasItems(items); }, [items]);
  useEffect(() => { saveViewport(viewportOffset, viewportScale); }, [viewportOffset, viewportScale]);

  // ── Sticker categories ──

  const stickerCategories = useMemo(() => STICKER_CATALOG.filter((c) => c.stickers.length > 0), []);
  const activeStickerCategory = useMemo(
    () => stickerCategories.find((c) => c.id === activeStickerCategoryId) ?? stickerCategories[0] ?? null,
    [activeStickerCategoryId, stickerCategories],
  );

  useEffect(() => {
    if (!activeStickerCategory && stickerCategories[0]) {
      setActiveStickerCategoryId(stickerCategories[0].id);
    }
  }, [activeStickerCategory, stickerCategories]);

  // ── Item operations ──

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

  const handleBlur = useCallback((event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!editingRef.current) return;
    const elapsed = Date.now() - editStartedAtRef.current;
    if (elapsed < BLUR_GUARD_MS) {
      const el = event.target;
      setTimeout(() => {
        if (editingRef.current && document.activeElement !== el) el.focus();
      }, 10);
      return;
    }
    editingRef.current = null;
    commitEdit();
  }, [commitEdit]);

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
    focusRelayRef.current?.focus();
    editStartedAtRef.current = Date.now();
    setSelectedId(item.id);
    setEditingItemId(item.id);
    editingRef.current = item.id;
    setDraftTitle(item.title ?? '');
    setDraftText(item.text ?? '');
  }, []);

  // ── Add items ──

  const screenToWorld = useCallback((screenX: number, screenY: number) => ({
    x: (screenX - viewportOffset.x) / viewportScale,
    y: (screenY - viewportOffset.y) / viewportScale,
  }), [viewportOffset.x, viewportOffset.y, viewportScale]);

  const getBoardCenter = useCallback(() => {
    const rect = boardRef.current?.getBoundingClientRect();
    return screenToWorld(rect ? rect.width / 2 : 180, rect ? rect.height / 2 : 300);
  }, [screenToWorld]);

  const addCanvasItem = useCallback((type: 'note' | 'entry') => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const center = getBoardCenter();
    const base = type === 'note'
      ? { w: 176, h: 146, color: cardColors[0], text: '', date: focusDate }
      : { w: 196, h: 178, color: cardColors[1], title: focusDate ?? getDateString(), text: '', date: focusDate };

    setItems((prev) => {
      const maxZ = prev.reduce((max, item) => Math.max(max, item.z), 0);
      return [...prev, {
        id, type,
        x: center.x - base.w / 2, y: center.y - base.h / 2,
        r: type === 'note' ? -2 : 2,
        w: base.w, h: base.h,
        z: maxZ + 1,
        color: base.color,
        title: 'title' in base ? base.title : undefined,
        text: base.text,
        date: base.date ?? undefined,
      }];
    });
    setSelectedId(id);
  }, [cardColors, focusDate, getBoardCenter]);

  const addStickerItem = useCallback((sticker: StickerDefinition, categoryId: string) => {
    const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const center = getBoardCenter();
    setItems((prev) => {
      const maxZ = prev.reduce((max, item) => Math.max(max, item.z), 0);
      return [...prev, {
        id, type: 'sticker' as const,
        x: center.x - 56, y: center.y - 56,
        r: 0, w: 112, h: 112,
        z: maxZ + 1,
        title: sticker.label,
        imageUrl: sticker.src,
        stickerCategory: categoryId,
        date: focusDate ?? undefined,
      }];
    });
    setSelectedId(id);
    setIsStickerDrawerOpen(false);
  }, [focusDate, getBoardCenter]);

  const deletedIdsRef = useRef(loadDeletedIds());

  const deleteItem = useCallback((id: string) => {
    deletedIdsRef.current.add(id);
    saveDeletedIds(deletedIdsRef.current);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedId(null);
  }, []);

  // ── Center viewport on focusDate items ──

  useEffect(() => {
    if (!focusDate) {
      centeredFocusDateRef.current = null;
      return;
    }
    if (centeredFocusDateRef.current === focusDate || !boardRef.current) return;
    const dateItems = items.filter((item) => {
      if (item.type === 'photo') return item.date === focusDate;
      if (item.type === 'sticker') return item.date === focusDate;
      return item.date === focusDate || (item.type === 'entry' && item.title === focusDate);
    });
    if (dateItems.length === 0) return;
    const rect = boardRef.current.getBoundingClientRect();
    const minX = Math.min(...dateItems.map((i) => i.x));
    const minY = Math.min(...dateItems.map((i) => i.y));
    const maxX = Math.max(...dateItems.map((i) => i.x + i.w));
    const maxY = Math.max(...dateItems.map((i) => i.y + i.h));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const scale = 1;
    setViewportScale(scale);
    setViewportOffset({ x: rect.width / 2 - cx * scale, y: rect.height / 2 - cy * scale });
    centeredFocusDateRef.current = focusDate;
  }, [focusDate, items]);

  // ── Sync mood cards from history ──

  const syncMoodCards = useCallback(() => {
    const deleted = deletedIdsRef.current;
    const generated = buildItemsFromMoodHistory(loadMoodHistory()).filter((i) => !deleted.has(i.id));
    setItems((prev) => mergeMoodItems(prev, generated));
  }, []);

  useEffect(() => {
    syncMoodCards();
    const handler = () => syncMoodCards();
    window.addEventListener(MOOD_HISTORY_UPDATED_EVENT, handler as EventListener);
    window.addEventListener('focus', handler);
    window.addEventListener('storage', handler as EventListener);
    return () => {
      window.removeEventListener(MOOD_HISTORY_UPDATED_EVENT, handler as EventListener);
      window.removeEventListener('focus', handler);
      window.removeEventListener('storage', handler as EventListener);
    };
  }, [syncMoodCards]);

  const visibleItems = useMemo(() => {
    if (focusDate) {
      return items.filter((item) => {
        if (item.type === 'photo') return item.date === focusDate;
        if (item.type === 'sticker') return item.date === focusDate;
        // notes and entries: match by item.date or (for entries) item.title
        return item.date === focusDate || (item.type === 'entry' && item.title === focusDate);
      });
    }
    const now = new Date();
    return items.filter((item) => item.type !== 'photo' || isDateInFilter(item.date, filter, now));
  }, [filter, focusDate, items]);

  // ── Pointer / gesture helpers ──

  const pointerToBoard = useCallback((event: PointerEvent | ReactPointerEvent) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const pointerToWorld = useCallback((event: PointerEvent | ReactPointerEvent) => {
    const p = pointerToBoard(event);
    return screenToWorld(p.x, p.y);
  }, [pointerToBoard, screenToWorld]);

  const startDrag = useCallback((event: ReactPointerEvent, item: MoodCanvasItem) => {
    event.preventDefault();
    event.stopPropagation();
    const point = pointerToWorld(event);
    actionRef.current = {
      mode: 'drag', itemId: item.id,
      startX: item.x, startY: item.y,
      pointerStartX: point.x, pointerStartY: point.y,
    };
  }, [pointerToWorld]);

  const startRotate = useCallback((event: ReactPointerEvent, item: MoodCanvasItem) => {
    event.stopPropagation();
    const p = pointerToWorld(event);
    const centerX = item.x + item.w / 2;
    const centerY = item.y + item.h / 2;
    actionRef.current = {
      mode: 'rotate', itemId: item.id, startR: item.r,
      centerX, centerY,
      pointerStartAngle: angleFromPoint(p.x, p.y, centerX, centerY),
    };
  }, [pointerToWorld]);

  // ── Global pointer move / up ──

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (boardPointersRef.current.has(event.pointerId)) {
        boardPointersRef.current.set(event.pointerId, pointerToBoard(event));
      }
      if (!actionRef.current) return;
      const action = actionRef.current;

      if (action.mode === 'pan') {
        const point = pointerToBoard(event);
        setViewportOffset({ x: action.startOffsetX + point.x - action.pointerStartX, y: action.startOffsetY + point.y - action.pointerStartY });
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
        setViewportOffset({ x: center.x - action.worldCenterX * nextScale, y: center.y - action.worldCenterY * nextScale });
        return;
      }

      const point = pointerToWorld(event);

      if (action.mode === 'drag') {
        updateItem(action.itemId, (item) => ({ ...item, x: action.startX + point.x - action.pointerStartX, y: action.startY + point.y - action.pointerStartY }));
        return;
      }

      if (action.mode === 'rotate') {
        const angle = angleFromPoint(point.x, point.y, action.centerX, action.centerY);
        updateItem(action.itemId, (item) => ({ ...item, r: Math.round((action.startR + angle - action.pointerStartAngle) * 10) / 10 }));
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

  // ── Render ──

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: palette.pageBg }}>
      {/* Hidden focus relay for iOS keyboard */}
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
          if (isStickerDrawerOpen) return;
          const hitCard = !!(event.target as HTMLElement).closest('[data-board-item]');
          if (!hitCard) {
            if (editingItemId) { editingRef.current = null; commitEdit(); }
            setSelectedId(null);
          }
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
              pointerA: first[0], pointerB: second[0],
              startScale: viewportScale, startDistance,
              worldCenterX: (center.x - viewportOffset.x) / viewportScale,
              worldCenterY: (center.y - viewportOffset.y) / viewportScale,
            };
            return;
          }

          actionRef.current = {
            mode: 'pan',
            startOffsetX: viewportOffset.x, startOffsetY: viewportOffset.y,
            pointerStartX: point.x, pointerStartY: point.y,
          };
        }}
        onPointerUp={(event) => {
          boardPointersRef.current.delete(event.pointerId);
          if (actionRef.current?.mode === 'pinch') actionRef.current = null;
        }}
        onPointerCancel={(event) => {
          boardPointersRef.current.delete(event.pointerId);
          if (actionRef.current?.mode === 'pinch') actionRef.current = null;
        }}
        className="relative h-full w-full overflow-hidden"
        style={{
          touchAction: 'none',
          backgroundColor: palette.pageBg,
          backgroundImage: `linear-gradient(to right, ${palette.line} 1px, transparent 1px), linear-gradient(to bottom, ${palette.line} 1px, transparent 1px)`,
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
          {visibleItems.map((item) => (
            <CanvasItemView
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              isEditing={item.id === editingItemId}
              isDark={isDark}
              palette={palette}
              draftTitle={draftTitle}
              draftText={draftText}
              onDraftTitleChange={setDraftTitle}
              onDraftTextChange={setDraftText}
              editFocusRef={editFocusRef}
              handleBlur={handleBlur}
              onPointerDown={(event) => {
                setSelectedId(item.id);
                bringToFront(item.id);
                if (boardPointersRef.current.size >= 1) { lastTapRef.current = null; return; }
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
              onStartDrag={(event) => startDrag(event, item)}
              onStartRotate={(event) => startRotate(event, item)}
              onDelete={() => deleteItem(item.id)}
              onCommitEdit={commitEdit}
              t={t}
            />
          ))}
        </div>

        {/* ── Header: back button (day view) or filter chips (full canvas) ── */}
        <div
          className="absolute left-3 right-3 z-40 flex items-start gap-3"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          {focusDate && onBack ? (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onBack}
              className="flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase tracking-widest"
              style={{ borderColor: palette.chromeBorder, color: palette.chromeText, backgroundColor: palette.chromeBg }}
            >
              <ArrowLeft size={11} />
              {focusDate}
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {MOOD_CANVAS_FILTER_KEYS.map((option) => {
                const isActive = option.value === filter;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setFilter(option.value)}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-widest border transition-colors"
                    style={{
                      borderColor: isActive ? palette.activeChipBorder : palette.chromeBorder,
                      backgroundColor: isActive ? palette.activeChipBg : palette.chromeBg,
                      color: isActive ? palette.accent : palette.chromeText,
                    }}
                  >
                    {t(option.key as any)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="absolute bottom-24 left-3 z-40 flex items-center gap-2">
          {(['note', 'entry'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => addCanvasItem(type)}
              className="px-2.5 py-1 text-[10px] uppercase tracking-widest border"
              style={{ borderColor: palette.chromeBorder, color: palette.chromeText, backgroundColor: palette.chromeBg }}
            >
              {t(type === 'note' ? 'canvasAddNote' : 'canvasAddEntry')}
            </button>
          ))}
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              if (editingItemId) { editingRef.current = null; commitEdit(); }
              setIsStickerDrawerOpen(true);
            }}
            className="px-2.5 py-1 text-[10px] uppercase tracking-widest border"
            style={{ borderColor: palette.chromeBorder, color: palette.chromeText, backgroundColor: palette.chromeBg }}
          >
            {t('canvasAddSticker')}
          </button>
        </div>

        <StickerDrawer
          isOpen={isStickerDrawerOpen}
          onClose={() => setIsStickerDrawerOpen(false)}
          palette={palette}
          isDark={isDark}
          categories={stickerCategories}
          activeCategory={activeStickerCategory}
          onCategoryChange={setActiveStickerCategoryId}
          onSelectSticker={addStickerItem}
          t={t}
        />
      </div>
    </div>
  );
}
