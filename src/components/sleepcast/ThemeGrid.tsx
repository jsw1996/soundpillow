import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Clock, Play, Sparkles, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { SLEEPCAST_THEMES } from '../../data/sleepcastThemes';
import {
  type MockStory,
  STORY_CATEGORIES,
  getTrendingStories,
  getStoriesByCategory,
} from '../../data/mockStories';
import { PillRow } from '../shared/PillRow';
import { useTranslation } from '../../i18n';
import type { GeneratedSleepcast, SleepcastTheme } from '../../types';
import { screenTransition } from '../../utils/animations';

const SLEEPCAST_BACKGROUND = 'linear-gradient(315deg, #ffffff, #def1ff)';

const DEFAULT_CATEGORY_CARD_STYLE = {
  glow: 'rgba(139, 92, 246, 0.30)',
  tint: 'radial-gradient(circle at top right, rgba(255,255,255,0.16) 0%, transparent 48%)',
  accent: 'rgba(255,255,255,0.18)',
  badge: 'rgba(255,255,255,0.14)',
};

const CATEGORY_CARD_STYLES: Record<string, typeof DEFAULT_CATEGORY_CARD_STYLE> = {
  'fairy-tale': {
    glow: 'rgba(244, 114, 182, 0.28)',
    tint: 'radial-gradient(circle at top right, rgba(244,114,182,0.22) 0%, transparent 54%)',
    accent: 'rgba(251, 207, 232, 0.18)',
    badge: 'rgba(244, 114, 182, 0.15)',
  },
  'animal-friends': {
    glow: 'rgba(245, 158, 11, 0.30)',
    tint: 'radial-gradient(circle at top right, rgba(251,191,36,0.22) 0%, transparent 54%)',
    accent: 'rgba(253, 230, 138, 0.18)',
    badge: 'rgba(251, 191, 36, 0.16)',
  },
  'city-life': {
    glow: 'rgba(59, 130, 246, 0.30)',
    tint: 'radial-gradient(circle at top right, rgba(96,165,250,0.24) 0%, transparent 54%)',
    accent: 'rgba(191, 219, 254, 0.18)',
    badge: 'rgba(96, 165, 250, 0.15)',
  },
};

function getCategoryCardStyle(categoryId: string) {
  return CATEGORY_CARD_STYLES[categoryId] ?? DEFAULT_CATEGORY_CARD_STYLE;
}

/* ─── Trending Carousel ─── */

function TrendingCard({ story, onPlay }: { story: MockStory; onPlay: () => void }) {
  const isTodaysPick = story.isTodaysPick;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPlay}
      className="group relative shrink-0 snap-center overflow-hidden rounded-[1.75rem] text-left"
      style={{ width: '80vw', maxWidth: '19rem', height: '10.5rem' }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={story.imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-active:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10" />
      </div>

      {/* Badge */}
      <div className="absolute left-4 top-4">
        {isTodaysPick ? (
          <span className="sleepcast-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
            <Sparkles size={12} />
            Today's Pick
          </span>
        ) : (
          <span className="sleepcast-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            <TrendingUp size={12} />
            Trending
          </span>
        )}
      </div>

      {/* Play button overlay */}
      <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-transform group-active:scale-90">
        <Play size={16} fill="white" className="ml-0.5 text-white" />
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white">
          {story.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/65">
          {story.subtitle}
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-white/50">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {story.duration}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Story List Card (scrollable inner list) ─── */

function StoryListCard({
  category,
  stories,
  onPlay,
}: {
  category: typeof STORY_CATEGORIES[number];
  stories: MockStory[];
  onPlay: (story: MockStory) => void;
}) {
  const cardStyle = getCategoryCardStyle(category.id);

  return (
    <div
      className="relative isolate flex h-full shrink-0 snap-center flex-col overflow-hidden rounded-4xl border border-white/60 text-[#17181c] backdrop-blur-xl"
      style={{
        width: '85vw',
        maxWidth: '20rem',
        background: `radial-gradient(circle at top right, rgba(255,255,255,0.76) 0%, rgba(255,255,255,0.14) 34%, transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(248,251,255,0.76) 46%, rgba(242,246,252,0.72) 100%), ${cardStyle.tint}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(255,255,255,0.24), 0 28px 42px rgba(148,163,184,0.20), 0 10px 18px rgba(15,23,42,0.07), 0 0 0 1px rgba(255,255,255,0.42)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-90"
        aria-hidden
        style={{ background: `radial-gradient(circle at 18% 0%, ${cardStyle.glow} 0%, transparent 62%)` }}
      />
      <div
        className="pointer-events-none absolute -right-12 top-24 h-40 w-40 rounded-full blur-3xl"
        aria-hidden
        style={{ background: cardStyle.glow, opacity: 0.18 }}
      />

      {/* Card header */}
      <div className="relative px-4 pb-3 pt-4">
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.15rem] border border-white/70 bg-white/55 text-[1.15rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]"
            style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.88), 0 12px 24px ${cardStyle.glow}` }}
          >
            {category.emoji}
          </div>

          <div className="min-w-0 flex-1 pt-px">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/32">
                Curated stories
              </p>
              <span className="h-px flex-1 bg-black/6" />
            </div>
            <h3 className="mt-1 text-[1rem] font-semibold tracking-[-0.03em] text-[#111217]">
              {category.label}
            </h3>
          </div>

          <span
            className="rounded-full border border-white/60 px-2.5 py-0.5 text-[10px] font-semibold text-black/60"
            style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.78) 0%, ${cardStyle.badge} 100%)` }}
          >
            {stories.length}
          </span>
        </div>
      </div>

      <div className="px-5">
        <div className="h-px bg-linear-to-r from-black/10 via-black/5 to-transparent" />
      </div>

      {/* Scrollable story list */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => onPlay(story)}
            className="group relative mb-1 flex w-full items-center gap-3 bg-transparent p-0 text-left transition duration-300 active:scale-[0.985]"
          >
            {/* Thumbnail */}
            <div className="relative h-[5rem] w-[5rem] shrink-0 overflow-hidden rounded-xl border border-white/50 shadow-[0_12px_20px_rgba(148,163,184,0.16)]">
              <img
                src={story.imageUrl}
                alt=""
                className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-active:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 rounded-xl bg-linear-to-t from-black/46 via-black/6 to-white/18" />
            </div>

            {/* Info */}
            <div className="relative min-w-0 flex-1 pr-1">
              <div className="flex flex-wrap items-center gap-2">
                {story.isTodaysPick ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-100/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                    <Sparkles size={10} />
                    Pick
                  </span>
                ) : story.isTrending ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/35 bg-sky-100/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700">
                    <TrendingUp size={10} />
                    Hot
                  </span>
                ) : null}

                <span className="rounded-full border border-white/55 bg-white/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/44">
                  {story.duration}
                </span>
              </div>

              <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-[1.28] tracking-[-0.015em] text-[#17181c]">
                {story.title}
              </p>
            </div>
          </button>
        ))}

        {stories.length === 0 && (
          <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-black/8 bg-white/35 px-5 text-center text-sm text-black/34">
            No stories yet
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#eef3f9] via-[#eef3f9]/74 to-transparent" />
    </div>
  );
}

/* ─── Main ThemeGrid (redesigned) ─── */

export function ThemeGrid({
  onSelect,
  onStartMockStory,
  isConfigured,
  dailyStories,
  storiesLoading,
  onRetry,
}: {
  onSelect: (theme: SleepcastTheme) => void;
  onStartMockStory: (story: MockStory) => void;
  isConfigured: boolean;
  dailyStories: GeneratedSleepcast[];
  storiesLoading: boolean;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const categoryCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const categoryScrollAnimationRef = useRef<number | null>(null);
  const categoryScrollSyncFrameRef = useRef<number | null>(null);

  const trendingStories = useMemo(() => getTrendingStories(), []);

  const categorizedGroups = useMemo(
    () => STORY_CATEGORIES.filter((category) => category.id !== 'all').map((category) => ({
      category,
      stories: getStoriesByCategory(category.id),
    })),
    [],
  );

  const animateCategoryScroll = useCallback((
    targetLeft: number,
    options?: { onApproachCenter?: () => void; onComplete?: () => void },
  ) => {
    const scroller = categoryScrollRef.current;
    if (!scroller) return;

    if (categoryScrollAnimationRef.current !== null) {
      cancelAnimationFrame(categoryScrollAnimationRef.current);
    }

    const startLeft = scroller.scrollLeft;
    const distance = targetLeft - startLeft;
    const duration = Math.min(700, Math.max(380, Math.abs(distance) * 0.9));
    const startTime = performance.now();
    const previousSnapType = scroller.style.scrollSnapType;
    let hasApproachedCenter = false;

    scroller.style.scrollSnapType = 'none';

    const easeInOutCubic = (progress: number) => (
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    );

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      scroller.scrollLeft = startLeft + distance * easeInOutCubic(progress);

      if (!hasApproachedCenter && progress >= 0.55) {
        hasApproachedCenter = true;
        options?.onApproachCenter?.();
      }

      if (progress < 1) {
        categoryScrollAnimationRef.current = requestAnimationFrame(step);
      } else {
        scroller.scrollLeft = targetLeft;
        scroller.style.scrollSnapType = previousSnapType;
        categoryScrollAnimationRef.current = null;
        options?.onComplete?.();
      }
    };

    categoryScrollAnimationRef.current = requestAnimationFrame(step);
  }, []);

  const getCategoryCardScrollLeft = useCallback((categoryId: string) => {
    const scroller = categoryScrollRef.current;
    const targetCard = categoryCardRefs.current[categoryId];
    if (!scroller || !targetCard) return null;

    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = targetCard.getBoundingClientRect();
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    const centeredLeft =
      scroller.scrollLeft + (targetRect.left - scrollerRect.left) - (scroller.clientWidth - targetRect.width) / 2;

    return Math.max(0, Math.min(centeredLeft, maxScrollLeft));
  }, []);

  const syncActiveCategoryFromScroll = useCallback(() => {
    const scroller = categoryScrollRef.current;
    if (!scroller || categoryScrollAnimationRef.current !== null) {
      return;
    }

    if (scroller.scrollLeft <= 24) {
      if (activeCategory !== 'all') {
        setActiveCategory('all');
      }
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    let closestCategoryId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const { category } of categorizedGroups) {
      const card = categoryCardRefs.current[category.id];
      if (!card) continue;

      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - scrollerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCategoryId = category.id;
      }
    }

    if (closestCategoryId && closestCategoryId !== activeCategory) {
      setActiveCategory(closestCategoryId);
    }
  }, [activeCategory, categorizedGroups]);

  const handleCategoryChange = useCallback((id: string) => {
    if (id === activeCategory) {
      return;
    }

    if (id === 'all') {
      animateCategoryScroll(0, {
        onApproachCenter: () => {
          setActiveCategory('all');
        },
      });
      return;
    }

    const nextLeft = getCategoryCardScrollLeft(id);
    if (nextLeft === null) {
      setActiveCategory(id);
      return;
    }

    animateCategoryScroll(nextLeft, {
      onApproachCenter: () => {
        setActiveCategory(id);
      },
    });
  }, [activeCategory, animateCategoryScroll, getCategoryCardScrollLeft]);

  useEffect(() => {
    const scroller = categoryScrollRef.current;
    if (!scroller) return undefined;

    return () => {
      if (categoryScrollAnimationRef.current !== null) {
        cancelAnimationFrame(categoryScrollAnimationRef.current);
        categoryScrollAnimationRef.current = null;
      }
      scroller.style.scrollSnapType = '';
    };
  }, []);

  useEffect(() => {
    const scroller = categoryScrollRef.current;
    if (!scroller) return undefined;

    const handleScroll = () => {
      if (categoryScrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(categoryScrollSyncFrameRef.current);
      }

      categoryScrollSyncFrameRef.current = requestAnimationFrame(() => {
        categoryScrollSyncFrameRef.current = null;
        syncActiveCategoryFromScroll();
      });
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      if (categoryScrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(categoryScrollSyncFrameRef.current);
        categoryScrollSyncFrameRef.current = null;
      }
    };
  }, [syncActiveCategoryFromScroll]);

  const handleStoryPlay = useCallback((story: MockStory) => {
    if (onStartMockStory) {
      onStartMockStory(story);
      return;
    }

    const fallbackTheme = SLEEPCAST_THEMES.find((theme) => theme.id === story.themeId) ?? SLEEPCAST_THEMES[0];
    onSelect(fallbackTheme);
  }, [onSelect, onStartMockStory]);

  return (
    <motion.div
      {...screenTransition}
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: SLEEPCAST_BACKGROUND }}
    >
      {/* Daylight backdrop */}
      <div className="relative flex min-h-0 flex-1 flex-col text-[#17181c]" style={{ background: SLEEPCAST_BACKGROUND }}>
        {/* Soft gradient background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0" style={{ background: SLEEPCAST_BACKGROUND }} />
          <div className="absolute inset-x-6 top-28 h-40 rounded-[3rem] bg-[radial-gradient(circle,rgba(168,139,250,0.14)_0%,transparent_72%)] opacity-70 blur-3xl" />
          <div className="absolute -right-12 top-56 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.10)_0%,transparent_72%)] blur-3xl" />
        </div>

        {/* Fixed layout — no page scroll */}
        <div
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{
            background: SLEEPCAST_BACKGROUND,
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))',
          }}
        >
          {/* ── Header (fixed) ── */}
          <div className="shrink-0 px-5 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/35">
              {t('sleepcastCollectionLabel')}
            </p>
            <h1 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-[-0.04em] text-[#111217]">
              Bedtime Stories
              <span className="ml-1.5 inline-block text-[1.6rem]">🌙</span>
            </h1>
          </div>

          {/* ── Trending / Today's Pick Carousel (fixed) ── */}
          <div className="mt-4 shrink-0">
            <div className="flex items-center gap-2 px-5">
              <Star size={14} className="text-amber-500" />
              <h2 className="text-sm font-bold text-[#17181c]">Trending & Today's Pick</h2>
            </div>

            <div className="mt-3 overflow-x-auto">
              <div className="flex snap-x snap-mandatory gap-4 px-5" style={{ scrollPaddingLeft: '1.25rem' }}>
                {trendingStories.map((story) => (
                  <TrendingCard
                    key={story.id}
                    story={story}
                    onPlay={() => handleStoryPlay(story)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Category Pills (fixed) ── */}
          <div className="mt-5 shrink-0">
            <PillRow
              items={STORY_CATEGORIES}
              activeId={activeCategory}
              onItemSelect={(category) => {
                handleCategoryChange(category.id);
              }}
              getLabel={(category) => category.label}
              getLeading={(category) => <span>{category.emoji}</span>}
              containerClassName="overflow-x-auto no-scrollbar px-5"
              listClassName="flex min-w-max gap-2 pr-5"
            />
          </div>

          {/* ── Story Cards by Category (fills remaining space) ── */}
          <div className="relative mt-4 min-h-0 flex-1">
            <div className="mb-2 flex items-center gap-2 px-5">
              <BookOpen size={14} className="text-black/40" />
              <h2 className="text-sm font-bold text-[#17181c]">Browse by Category</h2>
            </div>

            {/* Absolute positioned scroll area to guarantee full remaining height */}
            <div className="absolute inset-x-0 bottom-0 top-8 overflow-hidden">
              <div
                ref={categoryScrollRef}
                className="flex h-full snap-x snap-proximity gap-4 overflow-x-auto px-5 pb-8"
                style={{ scrollPaddingLeft: '1.25rem' }}
              >
                {categorizedGroups.map(({ category, stories }) => (
                  <div
                    key={category.id}
                    ref={(node) => {
                      categoryCardRefs.current[category.id] = node;
                    }}
                    className="flex h-full shrink-0 snap-center"
                  >
                    <StoryListCard
                      category={category}
                      stories={stories}
                      onPlay={handleStoryPlay}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
