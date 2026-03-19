import { useCallback, useMemo } from 'react';
import { BookOpen, Building2, Clock, PawPrint, Play, Shuffle, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import {
  type Story,
  type StoryCategory,
} from '../../data/stories';
import { useTranslation } from '../../i18n';
import { useAppContext } from '../../context/AppContext';
import { screenTransition } from '../../utils/animations';
import { PillRow } from '../shared/PillRow';
import { useScrollSync } from '../../hooks/useScrollSync';

const SLEEPCAST_LIGHT_BACKGROUND = 'linear-gradient(315deg, #ffffff, #def1ff)';
const SLEEPCAST_DARK_BACKGROUND = 'linear-gradient(180deg, #0f1219 0%, #141925 46%, #0c1016 100%)';

function renderCategoryIcon(categoryId: string, className = 'h-5 w-5') {
  switch (categoryId) {
    case 'all':
      return <BookOpen className={className} />;
    case 'fairy-tale':
      return <Sparkles className={className} />;
    case 'animal-friends':
      return <PawPrint className={className} />;
    case 'city-life':
      return <Building2 className={className} />;
    default:
      return <BookOpen className={className} />;
  }
}

function StoryStatusBadge({
  kind,
  label,
}: {
  kind: 'pick' | 'trending';
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
        kind === 'pick'
          ? 'border-amber-300/45 bg-amber-100/85 text-amber-700'
          : 'border-sky-300/45 bg-sky-100/85 text-sky-700'
      }`}
    >
      {kind === 'pick' ? <Sparkles size={10} /> : <TrendingUp size={10} />}
      {label}
    </span>
  );
}

function HighlightCarouselCard({
  story,
  onPlay,
}: {
  story: Story;
  onPlay: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onPlay}
      className="sleepcast-highlight-card group block shrink-0 snap-center text-left"
    >
      <div className="relative overflow-hidden rounded-[2rem]">
        <img
          src={story.imageUrl}
          alt=""
          className="h-[13.5rem] w-full object-cover transition-transform duration-700 ease-out group-active:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#08101d]/88 via-[#08101d]/30 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {story.isTodaysPick ? (
            <StoryStatusBadge kind="pick" label={t('sleepcastFreshTonight')} />
          ) : null}
          {story.isTrending ? (
            <StoryStatusBadge kind="trending" label={t('sleepcastAvailableNow')} />
          ) : null}
        </div>
        <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/16 text-white backdrop-blur-md transition-transform duration-300 group-active:scale-90">
          <Play size={18} fill="currentColor" className="ml-0.5" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/74">
            <Clock size={11} />
            {story.duration}
          </div>
          <h2 className="mt-2 max-w-[14rem] text-[1.45rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
            {story.title}
          </h2>
        </div>
      </div>

    </motion.button>
  );
}

function CategoryStoryTile({
  story,
  onPlay,
}: {
  story: Story;
  onPlay: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onPlay}
      className="sleepcast-category-tile group block shrink-0 snap-start text-left"
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl">
        <img
          src={story.imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-active:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#09111d]/80 via-[#09111d]/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/74">
            <span>{story.duration}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-[1rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
            {story.title}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function CategorySection({
  category,
  stories,
  onPlay,
  innerRef,
  isDark,
}: {
  category: StoryCategory;
  stories: Story[];
  onPlay: (story: Story) => void;
  innerRef: (node: HTMLDivElement | null) => void;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const leadStory = stories[0] ?? null;

  return (
    <section ref={innerRef}>
      <h2 className={`text-[1.15rem] font-semibold tracking-[-0.035em] ${isDark ? 'text-white/92' : 'text-[#111217]'}`}>
        {category.label}
      </h2>

      {leadStory ? (
        <div className="mt-4 overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex snap-x snap-proximity gap-3" style={{ scrollPaddingLeft: '0.25rem' }}>
            {stories.map((story) => (
              <CategoryStoryTile
                key={story.id}
                story={story}
                onPlay={() => onPlay(story)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={`mt-4 pb-4 text-sm ${isDark ? 'text-white/40' : 'text-black/36'}`}>
          {t('sleepcastNoResults')}
        </div>
      )}
    </section>
  );
}

export function ThemeGrid({
  onStartMockStory,
  catalogStories,
  storyCategories,
}: {
  onStartMockStory: (story: Story) => void;
  catalogStories: Story[];
  storyCategories: StoryCategory[];
}) {
  const { t } = useTranslation();
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';
  const sleepcastBackground = isDark ? SLEEPCAST_DARK_BACKGROUND : SLEEPCAST_LIGHT_BACKGROUND;

  const categoryIds = useMemo(
    () => storyCategories.map((c) => c.id),
    [storyCategories],
  );

  const { activeCategory, scrollViewportRef, setSectionRef, scrollToCategory } = useScrollSync(categoryIds);

  const highlightStories = useMemo((): Story[] => {
    if (catalogStories.length === 0) return [];

    return catalogStories.slice(0, 3).map((story, index) => ({
      ...story,
      isTodaysPick: index === 0,
      isTrending: index > 0,
    }));
  }, [catalogStories]);

  const categorizedGroups = useMemo(
    () => storyCategories
      .filter((category) => category.id !== 'all')
      .map((category) => ({
        category,
        stories: catalogStories.filter((story) => story.category === category.id),
      })),
    [catalogStories, storyCategories],
  );

  const handleStoryPlay = useCallback((story: Story) => {
    onStartMockStory(story);
  }, [onStartMockStory]);

  return (
    <motion.div
      {...screenTransition}
      className="absolute inset-0 overflow-hidden"
      style={{ background: sleepcastBackground }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0" style={{ background: sleepcastBackground }} />
        <div className={`absolute inset-x-6 top-24 h-44 rounded-[3rem] bg-[radial-gradient(circle,rgba(168,139,250,0.12)_0%,transparent_72%)] blur-3xl ${isDark ? 'opacity-100' : 'opacity-80'}`} />
        <div className={`absolute -right-10 top-52 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_72%)] blur-3xl ${isDark ? 'opacity-80' : 'opacity-100'}`} />
        <div className={`absolute -left-12 bottom-28 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.12)_0%,transparent_74%)] blur-3xl ${isDark ? 'opacity-80' : 'opacity-100'}`} />
      </div>

      <div
        ref={scrollViewportRef}
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden no-scrollbar"
      >
        <div
          className="px-5 md:px-8"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
          }}
        >
          {highlightStories.length > 0 ? (
            <section className="pt-3">
              <div className="overflow-x-auto no-scrollbar -mx-5 px-5 md:-mx-8 md:px-8">
                <div className="flex snap-x snap-mandatory gap-4 pr-5 md:pr-8" style={{ scrollPaddingLeft: '1.25rem' }}>
                  {highlightStories.map((story) => (
                    <HighlightCarouselCard
                      key={story.id}
                      story={story}
                      onPlay={() => handleStoryPlay(story)}
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {catalogStories.length > 1 ? (
            <section className="mt-5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  const idx = Math.floor(Math.random() * catalogStories.length);
                  handleStoryPlay(catalogStories[idx]);
                }}
                className="group relative w-full overflow-hidden rounded-[1.6rem] text-left"
              >
                {/* layered watercolor-ish background */}
                <div className={`absolute inset-0 ${isDark ? 'bg-linear-to-br from-[#232439] via-[#182235] to-[#122031]' : 'bg-linear-to-br from-[#ede9fe] via-[#e0e7ff] to-[#dbeafe]'}`} />
                <div className={`absolute -left-6 -top-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.35)_0%,transparent_70%)] blur-2xl ${isDark ? 'opacity-90' : ''}`} />
                <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.3)_0%,transparent_70%)] blur-2xl ${isDark ? 'opacity-90' : ''}`} />
                <div className={`absolute right-12 top-2 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.18)_0%,transparent_70%)] blur-xl ${isDark ? 'opacity-70' : ''}`} />

                <div className="relative flex items-center gap-4 px-5 py-5">
                  {/* icon */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm ${isDark ? 'border-white/12 bg-white/8' : 'border-white/50 bg-white/70'}`}>
                    <Shuffle size={19} className={isDark ? 'text-indigo-100' : 'text-indigo-500'} strokeWidth={2.4} />
                  </div>

                  {/* copy */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[0.95rem] font-semibold tracking-[-0.02em] ${isDark ? 'text-white/92' : 'text-[#1e1b4b]'}`}>
                      {t('sleepcastRandomTitle')}
                    </p>
                    <p className={`mt-1 text-[0.78rem] leading-snug ${isDark ? 'text-white/58' : 'text-indigo-900/45'}`}>
                      {t('sleepcastRandomSubtitle')}
                    </p>
                  </div>

                  {/* play arrow */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-300 group-active:scale-90 ${isDark ? 'bg-white/14 shadow-md shadow-black/30' : 'bg-indigo-500/90 shadow-md shadow-indigo-400/30'}`}>
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </motion.button>
            </section>
          ) : null}

          <div className="sticky z-20 -mx-5 mt-5 pb-4 pt-4 md:-mx-8" style={{ top: 'env(safe-area-inset-top)' }}>
            <div className="relative">
              <PillRow
                items={storyCategories}
                activeId={activeCategory}
                onItemSelect={(category) => {
                  scrollToCategory(category.id);
                }}
                getLabel={(category) => category.label}
                getLeading={(category) => renderCategoryIcon(category.id, 'h-3.5 w-3.5')}
                containerClassName="overflow-x-auto no-scrollbar"
                listClassName="flex min-w-max gap-2 pl-5 md:pl-8"
              />
            </div>
          </div>

          <div className="space-y-6">
            {categorizedGroups.map(({ category, stories }) => (
              <CategorySection
                key={category.id}
                category={category}
                stories={stories}
                onPlay={handleStoryPlay}
                isDark={isDark}
                innerRef={(node) => {
                  setSectionRef(category.id, node);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
