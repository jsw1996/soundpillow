import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { StickerDefinition, StickerCategoryDefinition } from '../../data/stickerCatalog';
import type { CanvasPalette } from './canvasTheme';

interface StickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  palette: CanvasPalette;
  isDark: boolean;
  categories: StickerCategoryDefinition[];
  activeCategory: StickerCategoryDefinition | null;
  onCategoryChange: (id: string) => void;
  onSelectSticker: (sticker: StickerDefinition, categoryId: string) => void;
  t: (key: any) => string;
}

export function StickerDrawer({
  isOpen,
  onClose,
  palette,
  isDark,
  categories,
  activeCategory,
  onCategoryChange,
  onSelectSticker,
  t,
}: StickerDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed inset-0 z-[70] flex items-end backdrop-blur-[1px] ${isDark ? 'bg-black/50' : 'bg-black/30'}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="app-bottom-sheet w-full rounded-t-[2rem] border-t px-4 pt-3 shadow-2xl"
            style={{
              minHeight: 'min(32rem, 68dvh)',
              borderColor: palette.sheetBorder,
              backgroundColor: palette.sheetBg,
              paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative mb-4 flex items-center justify-end gap-4">
              <div className="absolute inset-x-0 flex justify-center pointer-events-none">
                <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-center" style={{ color: palette.text }}>
                  {t('canvasStickerDrawerTitle')}
                </h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{ borderColor: palette.sheetButtonBorder, color: palette.softText, backgroundColor: palette.sheetButtonBg }}
                aria-label={t('canvasStickerDrawerClose')}
              >
                <X size={14} />
              </button>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((category) => {
                const isActive = category.id === activeCategory?.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onCategoryChange(category.id)}
                    className="shrink-0 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
                    style={{
                      borderColor: isActive ? palette.activeChipBorder : palette.sheetButtonBorder,
                      backgroundColor: isActive ? palette.activeChipBg : palette.sheetButtonBg,
                      color: isActive ? palette.accent : palette.chromeText,
                    }}
                  >
                    {t(`canvasStickerCategory_${category.id}` as any) === `canvasStickerCategory_${category.id}`
                      ? category.label
                      : t(`canvasStickerCategory_${category.id}` as any)}
                  </button>
                );
              })}
            </div>

            {activeCategory ? (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {activeCategory.stickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => onSelectSticker(sticker, activeCategory.id)}
                    className="flex aspect-square items-center justify-center p-2 transition-transform active:scale-95"
                    aria-label={sticker.label}
                  >
                    <img
                      src={sticker.src}
                      alt={sticker.label}
                      className="h-full w-full object-contain"
                      style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.14))' }}
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="rounded-3xl border border-dashed px-4 py-8 text-center text-xs"
                style={{ borderColor: palette.sheetEmptyBorder, color: palette.softText, backgroundColor: palette.sheetEmptyBg }}
              >
                {t('canvasStickerDrawerEmpty')}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
