import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Trees, PawPrint, Wind, Sparkles } from 'lucide-react';
import { motion, animate } from 'motion/react';
import { CATEGORIES } from '../../constants';
import { useCategoryName } from '../../i18n';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Heart: <Heart size={18} />,
  Trees: <Trees size={18} />,
  PawPrint: <PawPrint size={18} />,
  Wind: <Wind size={18} />,
  Sparkles: <Sparkles size={18} />,
};

interface CategoryPillsProps {
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  scrollRootRef: React.RefObject<HTMLDivElement>;
}

export function CategoryPills({ activeCategory, onCategoryChange, scrollRootRef }: CategoryPillsProps) {
  const [isCategoryStuck, setIsCategoryStuck] = useState(false);
  const getCategoryName = useCategoryName();
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const root = scrollRootRef.current;
    const target = stickySentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsCategoryStuck(!entry.isIntersecting),
      { root, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [scrollRootRef]);

  const scrollPillToCenter = useCallback((id: string) => {
    const container = scrollContainerRef.current;
    const pill = pillRefs.current.get(id);
    if (!container || !pill) return;
    const containerRect = container.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const target =
      pill.offsetLeft - container.offsetLeft - containerRect.width / 2 + pillRect.width / 2;
    animate(container.scrollLeft, target, {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => { container.scrollLeft = v; },
    });
  }, []);

  return (
    <>
      {/* Sentinel — crossing this triggers the sticky backdrop */}
      <div ref={stickySentinelRef} className="h-px" />

      <div
        className="sticky z-10 pt-3 pb-3 relative"
        style={{ top: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        {/* Sticky backdrop blur */}
        <div
          className={`pointer-events-none absolute left-0 right-0 bottom-0 backdrop-blur-md transition-opacity duration-300 ${
            isCategoryStuck ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: 'calc(env(safe-area-inset-top) * -1)',
            background: 'color-mix(in srgb, var(--color-bg-dark, #1e1c23) 70%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,1) 100%)',
            maskImage:
              'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,1) 100%)',
          }}
        />

        {/* Pills */}
        <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto no-scrollbar px-6">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                ref={(el) => { if (el) pillRefs.current.set(cat.id, el); }}
                onClick={() => {
                  const next = isActive ? null : cat.id;
                  onCategoryChange(next);
                  if (next) scrollPillToCenter(next);
                }}
                animate={{
                  scale: isActive ? 1.06 : 1,
                  opacity: isActive ? 1 : 0.75,
                  borderRadius: '100px',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                whileTap={{ scale: 0.94 }}
                className={`flex items-center gap-2 px-4 py-1.5 whitespace-nowrap backdrop-blur-md border shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--color-primary,#8c2bee)_66%,white_18%)] text-white border-white/35 shadow-[0_0_20px_-5px_var(--glow-4)]'
                    : 'bg-white/70 text-foreground/80 border-white/25'
                }`}
              >
                {CATEGORY_ICONS[cat.icon]}
                <span className="text-sm font-semibold">{getCategoryName(cat.id)}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
