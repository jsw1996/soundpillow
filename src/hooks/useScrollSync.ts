import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Synchronizes a sticky category pill bar with scroll position of sections.
 * - Scrolling updates the active category based on which section is visible.
 * - Selecting a category programmatically scrolls to that section.
 */
export function useScrollSync(categoryIds: string[]) {
  const [activeCategory, setActiveCategory] = useState(categoryIds[0] ?? 'all');
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollSyncFrameRef = useRef<number | null>(null);
  const programmaticScrollRef = useRef(false);

  const setSectionRef = useCallback((id: string, node: HTMLDivElement | null) => {
    sectionRefs.current[id] = node;
  }, []);

  const syncActiveCategoryFromScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    if (viewport.scrollTop < 48) {
      if (activeCategory !== categoryIds[0]) {
        setActiveCategory(categoryIds[0]);
      }
      return;
    }

    const anchorTop = viewport.scrollTop + 132;
    let nextCategory = categoryIds[0];

    for (const id of categoryIds.slice(1)) {
      const section = sectionRefs.current[id];
      if (!section) continue;
      if (section.offsetTop <= anchorTop) {
        nextCategory = id;
      }
    }

    if (nextCategory !== activeCategory) {
      setActiveCategory(nextCategory);
    }
  }, [activeCategory, categoryIds]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return undefined;

    const handleScroll = () => {
      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
      }
      scrollSyncFrameRef.current = requestAnimationFrame(() => {
        scrollSyncFrameRef.current = null;
        syncActiveCategoryFromScroll();
      });
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
        scrollSyncFrameRef.current = null;
      }
    };
  }, [syncActiveCategoryFromScroll]);

  const scrollToCategory = useCallback((categoryId: string) => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      setActiveCategory(categoryId);
      return;
    }

    if (categoryId === categoryIds[0]) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveCategory(categoryIds[0]);
      return;
    }

    const targetSection = sectionRefs.current[categoryId];
    if (!targetSection) {
      setActiveCategory(categoryId);
      return;
    }

    const stickyOffset = 96;
    programmaticScrollRef.current = true;
    viewport.scrollTo({
      top: Math.max(0, targetSection.offsetTop - stickyOffset),
      behavior: 'smooth',
    });
    setActiveCategory(categoryId);

    // Re-enable scroll sync after the smooth scroll settles
    const releaseTimer = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 600);
    return () => clearTimeout(releaseTimer);
  }, [categoryIds]);

  return {
    activeCategory,
    scrollViewportRef,
    setSectionRef,
    scrollToCategory,
  };
}
