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
              className={`flex items-center gap-2 whitespace-nowrap border px-4 py-1.5 text-sm font-semibold backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${
                isActive
                  ? 'border-white/35 bg-[color-mix(in_srgb,var(--color-primary,#8c2bee)_66%,white_18%)] text-white shadow-[0_0_20px_-5px_var(--glow-4)]'
                  : 'border-white/25 bg-white/70 text-foreground/80'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
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
