import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { animate, motion } from 'motion/react';

interface PillRowProps<T extends { id: string }> {
  items: T[];
  activeId: string | null;
  onItemSelect: (item: T, isActive: boolean) => void;
  getLabel: (item: T) => string;
  getLeading?: (item: T) => ReactNode;
  shouldCenterOnPress?: (item: T, isActive: boolean) => boolean;
  containerClassName?: string;
  listClassName?: string;
}

export function PillRow<T extends { id: string }>({
  items,
  activeId,
  onItemSelect,
  getLabel,
  getLeading,
  shouldCenterOnPress = () => true,
  containerClassName = 'overflow-x-auto no-scrollbar px-6',
  listClassName = 'flex min-w-max gap-3',
}: PillRowProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const centerPill = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    const pill = pillRefs.current.get(id);
    if (!container || !pill) return;

    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const target = pill.offsetLeft - container.offsetLeft - containerRect.width / 2 + pillRect.width / 2;
    const nextLeft = Math.max(0, Math.min(target, maxScrollLeft));

    animate(container.scrollLeft, nextLeft, {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (value) => {
        container.scrollLeft = value;
      },
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    centerPill(activeId);
  }, [activeId, centerPill]);

  return (
    <div ref={scrollContainerRef} className={containerClassName}>
      <div className={listClassName}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <motion.button
              key={item.id}
              ref={(node) => {
                if (node) {
                  pillRefs.current.set(item.id, node);
                } else {
                  pillRefs.current.delete(item.id);
                }
              }}
              type="button"
              onClick={() => {
                onItemSelect(item, isActive);
                if (shouldCenterOnPress(item, isActive)) {
                  centerPill(item.id);
                }
              }}
              animate={{
                scale: 1,
                opacity: isActive ? 1 : 0.75,
                borderRadius: '100px',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              whileTap={{ scale: 0.94 }}
              className={`relative flex items-center gap-2 whitespace-nowrap border px-4 py-1.5 text-sm font-semibold glass-noise ${
                isActive
                  ? 'border-white/40 text-white'
                  : 'border-white/20 text-foreground/80'
              }`}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary, #8c2bee) 72%, white 16%) 0%, color-mix(in srgb, var(--color-primary, #8c2bee) 85%, black 8%) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: isActive
                  ? 'none'
                  : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(255,255,255,0.15)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {getLeading?.(item)}
              <span>{getLabel(item)}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
