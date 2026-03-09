import React, { useRef, useState, useEffect } from 'react';
import { Heart, Trees, PawPrint, Wind, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { useCategoryName } from '../../i18n';
import { PillRow } from '../shared/PillRow';

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

  return (
    <>
      {/* Sentinel — crossing this triggers the sticky backdrop */}
      <div ref={stickySentinelRef} className="h-px" />

      <div
        className="sticky z-10 pt-3 pb-3"
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
        <PillRow
          items={CATEGORIES}
          activeId={activeCategory}
          onItemSelect={(category, isActive) => {
            onCategoryChange(isActive ? null : category.id);
          }}
          getLabel={(category) => getCategoryName(category.id)}
          getLeading={(category) => CATEGORY_ICONS[category.icon]}
          shouldCenterOnPress={(_, isActive) => !isActive}
        />
      </div>
    </>
  );
}
