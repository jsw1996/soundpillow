import type { PointerEvent as ReactPointerEvent } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';
import type { MoodCanvasItem } from './canvasTypes';
import type { CanvasPalette } from './canvasTheme';
import { resolveCanvasItemColor } from './canvasTheme';

interface CanvasItemViewProps {
  item: MoodCanvasItem;
  isSelected: boolean;
  isEditing: boolean;
  isDark: boolean;
  palette: CanvasPalette;
  draftTitle: string;
  draftText: string;
  onDraftTitleChange: (text: string) => void;
  onDraftTextChange: (text: string) => void;
  editFocusRef: (el: HTMLTextAreaElement | HTMLInputElement | null) => void;
  handleBlur: (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onPointerDown: (event: ReactPointerEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onStartDrag: (event: ReactPointerEvent) => void;
  onStartRotate: (event: ReactPointerEvent) => void;
  onDelete: () => void;
  onCommitEdit: () => void;
  t: (key: any) => string;
}

export function CanvasItemView({
  item,
  isSelected,
  isEditing,
  isDark,
  palette,
  draftTitle,
  draftText,
  onDraftTitleChange,
  onDraftTextChange,
  editFocusRef,
  handleBlur,
  onPointerDown,
  onDoubleClick,
  onStartDrag,
  onStartRotate,
  onDelete,
  onCommitEdit,
  t,
}: CanvasItemViewProps) {
  const isSticker = item.type === 'sticker';

  return (
    <div
      data-board-item="1"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={`absolute transition-shadow ${item.type === 'photo' ? 'p-2 pb-7' : isSticker ? 'p-0' : 'p-3'}`}
      style={{
        touchAction: 'manipulation',
        width: item.w,
        height: item.h,
        left: item.x,
        top: item.y,
        transform: `rotate(${item.r}deg)`,
        zIndex: item.z,
        border: isSticker
          ? isSelected
            ? `1.5px dashed ${palette.selectedDashedBorder}`
            : '1px solid transparent'
          : isSelected
            ? `1.5px solid ${palette.selectedBorder}`
            : `1px solid ${palette.border}`,
        backgroundColor: isSticker ? 'transparent' : resolveCanvasItemColor(item.color, isDark),
        boxShadow: isSelected
          ? palette.selectedShadow
          : isSticker
            ? 'none'
          : item.type === 'photo'
            ? palette.photoShadow
            : palette.cardShadow,
      }}
    >
      {/* ── Note ── */}
      {item.type === 'note' && (
        <>
          <div className="h-0.5 w-8 mb-2" style={{ backgroundColor: palette.noteLine }} />
          {isEditing ? (
            <textarea
              ref={editFocusRef}
              value={draftText}
              onChange={(event) => onDraftTextChange(event.target.value)}
              onPointerDown={(event) => event.stopPropagation()}
              onBlur={handleBlur}
              placeholder={t('canvasNotePlaceholder')}
              className={`w-full h-[80%] bg-transparent text-xs leading-relaxed outline-none resize-none ${isDark ? 'placeholder:text-white/30' : 'placeholder:text-black/25'}`}
              style={{ color: palette.bodyText, caretColor: palette.accent }}
              autoFocus
            />
          ) : (
            <p className="leading-relaxed text-xs" style={{ color: item.text ? palette.bodyText : palette.placeholder }}>
              {item.text || t('canvasNotePlaceholder')}
            </p>
          )}
        </>
      )}

      {/* ── Entry ── */}
      {item.type === 'entry' && (
        <>
          <div className="flex items-center justify-between mb-2 pb-1.5" style={{ borderBottom: `1px solid ${palette.sectionDivider}` }}>
            {isEditing ? (
              <input
                value={draftTitle}
                onChange={(event) => onDraftTitleChange(event.target.value)}
                onPointerDown={(event) => event.stopPropagation()}
                onBlur={handleBlur}
                className="uppercase tracking-wider text-[10px] bg-transparent outline-none w-[85%]"
                style={{ color: palette.softText, caretColor: palette.accent }}
              />
            ) : (
              <span className="uppercase tracking-wider text-[10px]" style={{ color: palette.softText }}>
                {item.title}
              </span>
            )}
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.accent }} />
          </div>
          {isEditing ? (
            <textarea
              ref={editFocusRef}
              value={draftText}
              onChange={(event) => onDraftTextChange(event.target.value)}
              onPointerDown={(event) => event.stopPropagation()}
              onBlur={handleBlur}
              placeholder={t('canvasEntryPlaceholder')}
              className={`w-full h-[78%] bg-transparent text-xs leading-relaxed outline-none resize-none ${isDark ? 'placeholder:text-white/30' : 'placeholder:text-black/25'}`}
              style={{ color: palette.bodyTextStrong, caretColor: palette.accent }}
              autoFocus
            />
          ) : (
            <p className="leading-relaxed text-xs" style={{ color: item.text ? palette.bodyTextStrong : palette.placeholder }}>
              {item.text || t('canvasEntryPlaceholder')}
            </p>
          )}
        </>
      )}

      {/* ── Photo / Polaroid ── */}
      {item.type === 'photo' && (
        <div className="h-full w-full flex flex-col">
          <div
            className="relative w-full overflow-hidden"
            style={{ backgroundColor: palette.photoFrameBg, aspectRatio: '1 / 1' }}
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
            <p className="text-center italic text-[10px]" style={{ color: palette.softText }}>
              {item.caption}
            </p>
            {item.text && (
              <p
                className="leading-snug text-center mt-0.5 text-[10px]"
                style={{
                  color: palette.bodyTextSoft,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                "{item.text}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Sticker ── */}
      {item.type === 'sticker' && item.imageUrl && (
        <div className="h-full w-full flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.title ?? ''}
            className="h-full w-full object-contain select-none pointer-events-none"
            style={{ filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.16))' }}
            draggable={false}
          />
        </div>
      )}

      {/* ── Editing controls ── */}
      {isEditing && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onCommitEdit}
          className="absolute -top-3 right-0 px-2 py-0.5 border text-[9px] uppercase tracking-widest"
          style={{ borderColor: palette.controlBorder, backgroundColor: palette.controlBg, color: palette.controlText }}
        >
          {t('canvasDone')}
        </button>
      )}

      {/* ── Selection controls (drag / rotate / delete) ── */}
      {isSelected && !isEditing && (
        <>
          <button
            type="button"
            onPointerDown={onStartDrag}
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest cursor-grab active:cursor-grabbing"
            style={{ borderColor: palette.controlBorder, backgroundColor: palette.controlBg, color: palette.controlText }}
            aria-label={t('canvasDrag')}
          >
            {t('canvasDrag')}
          </button>

          <button
            type="button"
            onPointerDown={onStartRotate}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border flex items-center justify-center"
            style={{ borderColor: palette.controlBorder, backgroundColor: palette.controlBg, color: palette.accent }}
            aria-label="Rotate"
          >
            <RotateCw size={11} />
          </button>

          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              onDelete();
            }}
            className="absolute -top-3 -right-3 w-5 h-5 rounded-full border flex items-center justify-center"
            style={{ borderColor: palette.dangerBorder, backgroundColor: palette.controlBg, color: palette.dangerText }}
            aria-label="Delete"
          >
            <Trash2 size={10} />
          </button>
        </>
      )}
    </div>
  );
}
