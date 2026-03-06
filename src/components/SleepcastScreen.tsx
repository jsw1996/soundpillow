import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
  WifiOff,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { SLEEPCAST_THEMES } from '../data/sleepcastThemes';
import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../types';
import { useTranslation } from '../i18n';
import { PlayPauseButton } from './PlayPauseButton';

interface SleepcastScreenProps {
  status: SleepcastStatus;
  currentCast: GeneratedSleepcast | null;
  currentTheme: SleepcastTheme | null;
  activeParagraph: number;
  error: string | null;
  isConfigured: boolean;
  dailyStories: GeneratedSleepcast[];
  storiesLoading: boolean;
  onStartSleepcast: (theme: SleepcastTheme) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onRetry?: () => void;
}

interface SceneVisual {
  accent: string;
  rim: string;
  halo: string;
  haze: string;
  shadow: string;
}

const DEFAULT_VISUAL: SceneVisual = {
  accent: '#9B7ED8',
  rim: 'rgba(155, 126, 216, 0.22)',
  halo: 'rgba(155, 126, 216, 0.22)',
  haze: 'rgba(88, 58, 156, 0.12)',
  shadow: 'rgba(15, 23, 42, 0.24)',
};

const SCENE_VISUALS: Record<string, SceneVisual> = {
  'cabin-rain': {
    accent: '#A1C1E6',
    rim: 'rgba(161, 193, 230, 0.28)',
    halo: 'rgba(98, 151, 207, 0.24)',
    haze: 'rgba(230, 171, 103, 0.14)',
    shadow: 'rgba(14, 24, 40, 0.24)',
  },
  'ocean-voyage': {
    accent: '#76D5E8',
    rim: 'rgba(118, 213, 232, 0.28)',
    halo: 'rgba(63, 167, 209, 0.22)',
    haze: 'rgba(197, 229, 248, 0.16)',
    shadow: 'rgba(6, 21, 39, 0.24)',
  },
  'enchanted-forest': {
    accent: '#74D39D',
    rim: 'rgba(116, 211, 157, 0.26)',
    halo: 'rgba(86, 183, 120, 0.22)',
    haze: 'rgba(195, 255, 214, 0.14)',
    shadow: 'rgba(8, 24, 19, 0.22)',
  },
  'zen-garden': {
    accent: '#E4C8A7',
    rim: 'rgba(228, 200, 167, 0.26)',
    halo: 'rgba(226, 181, 126, 0.2)',
    haze: 'rgba(189, 223, 190, 0.16)',
    shadow: 'rgba(24, 18, 14, 0.22)',
  },
  stargazing: {
    accent: '#B6C5FF',
    rim: 'rgba(182, 197, 255, 0.28)',
    halo: 'rgba(126, 154, 255, 0.22)',
    haze: 'rgba(255, 234, 164, 0.16)',
    shadow: 'rgba(8, 12, 34, 0.24)',
  },
  'snow-lodge': {
    accent: '#E9F0FF',
    rim: 'rgba(233, 240, 255, 0.28)',
    halo: 'rgba(173, 204, 255, 0.18)',
    haze: 'rgba(255, 204, 138, 0.14)',
    shadow: 'rgba(15, 20, 34, 0.24)',
  },
};

function getSceneVisual(themeId: string): SceneVisual {
  return SCENE_VISUALS[themeId] ?? DEFAULT_VISUAL;
}

function getThemeName(t: ReturnType<typeof useTranslation>['t'], theme: SleepcastTheme) {
  return t(`sleepcastTheme_${theme.id}` as any) || theme.name;
}

function getThemeSummary(theme: SleepcastTheme) {
  const firstSentence = theme.prompt.replace(/\s+/g, ' ').split('. ')[0]?.trim() ?? theme.prompt;
  return firstSentence.length > 92 ? `${firstSentence.slice(0, 89)}...` : firstSentence;
}

function DaylightBackdrop({ theme }: { theme: SleepcastTheme }) {
  const visual = getSceneVisual(theme.id);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="sleepcast-daylight-bg absolute inset-0" />
      <motion.div
        className="absolute -right-20 top-[-4rem] h-72 w-72 rounded-full blur-3xl"
        animate={{ x: [0, 18, -4, 0], y: [0, 10, -14, 0], scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 72%)` }}
      />
      <motion.div
        className="absolute -left-24 bottom-[-5rem] h-80 w-80 rounded-full blur-3xl"
        animate={{ x: [0, -14, 8, 0], y: [0, -16, 12, 0], scale: [1, 0.95, 1.04, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(circle, ${visual.haze} 0%, transparent 72%)` }}
      />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white/28 to-transparent" />
    </div>
  );
}

function ScreenFrame({
  children,
  theme,
  bottomPadding = 'calc(1.5rem + env(safe-area-inset-bottom))',
}: {
  children: React.ReactNode;
  theme: SleepcastTheme;
  bottomPadding?: string;
}) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#edf0f4] text-[#17181c]">
      <DaylightBackdrop theme={theme} />
      <div
        className="relative z-10 flex flex-1 flex-col px-5"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: bottomPadding,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Loading view shown while fetching story from server */
function LoadingView({ theme }: { theme: SleepcastTheme }) {
  const { t } = useTranslation();
  const visual = getSceneVisual(theme.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col"
    >
      <ScreenFrame theme={theme}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-black/34">
              {t('sleepcastAiPowered')}
            </p>
            <h1 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.045em] text-[#17181c]">
              {getThemeName(t, theme)}
            </h1>
          </div>
          <div className="sleepcast-frost-card flex h-11 w-11 items-center justify-center rounded-full">
            <Sparkles size={18} style={{ color: visual.accent }} />
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] p-2 sleepcast-frost-card">
          <div className="relative h-[18.5rem] overflow-hidden rounded-[1.6rem]">
            <img
              src={theme.imageUrl}
              alt={getThemeName(t, theme)}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/18 to-black/74" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/28 bg-white/18 backdrop-blur-xl">
                <Loader2 size={30} className="animate-spin" style={{ color: visual.accent }} />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
                {t('sleepcastGenerating')}
              </p>
              <h2 className="mt-2 text-[2rem] font-semibold leading-[0.96] tracking-[-0.045em] text-white">
                {t('sleepcastTitle')}
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] p-6 text-center sleepcast-frost-card">
          <p className="text-sm leading-relaxed text-black/56">
            {t('sleepcastGeneratingDesc')}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                className="rounded-full"
                animate={{ height: [8, 24, 8], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12 }}
                style={{
                  width: 5,
                  background: visual.accent,
                  boxShadow: `0 0 16px ${visual.halo}`,
                }}
              />
            ))}
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

/** Active narration playback view */
function PlaybackView({
  cast,
  theme,
  activeParagraph,
  status,
  onTogglePlay,
  onStop,
}: {
  cast: GeneratedSleepcast;
  theme: SleepcastTheme;
  activeParagraph: number;
  status: SleepcastStatus;
  onTogglePlay: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  const visual = getSceneVisual(theme.id);
  const progress = cast.paragraphs.length > 0
    ? ((activeParagraph + 1) / cast.paragraphs.length) * 100
    : 0;
  const paragraphRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const target = paragraphRefs.current[activeParagraph];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeParagraph]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col"
    >
      <ScreenFrame theme={theme}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="sleepcast-frost-card rounded-full px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-black/58">
              {getThemeName(t, theme)}
            </div>
            <div className="sleepcast-frost-card rounded-full px-3 py-2 text-[11px] font-semibold text-black/44">
              {Math.max(activeParagraph + 1, 1)} / {cast.paragraphs.length}
            </div>
          </div>
          <button
            onClick={onStop}
            type="button"
            className="sleepcast-frost-card flex h-11 w-11 items-center justify-center rounded-full text-[#17181c] transition-transform active:scale-95"
          >
            <Square size={17} fill="currentColor" />
          </button>
        </div>

        <div className="mt-4 rounded-[2rem] p-2 sleepcast-frost-card">
          <div className="relative h-52 overflow-hidden rounded-[1.6rem]">
            <img
              src={theme.imageUrl}
              alt={cast.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/8 via-black/16 to-black/72" />
            <div className="absolute left-4 right-4 top-4">
              <div className="inline-flex rounded-full border border-white/16 bg-white/14 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                {status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused')}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
                {getThemeName(t, theme)}
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[0.96] tracking-[-0.045em] text-white">
                {cast.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-[2rem] p-4 sleepcast-frost-card">
          <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/36">
            <span>{status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused')}</span>
            <span>{cast.paragraphs.length} {t('sleepcastParagraphs')}</span>
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3 pb-1">
              {cast.paragraphs.map((paragraph, index) => {
                const isActive = index === activeParagraph;
                const isPast = index < activeParagraph;

                return (
                  <motion.div
                    key={index}
                    ref={(node) => {
                      paragraphRefs.current[index] = node;
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: isActive ? 1 : isPast ? 0.68 : 0.48,
                      y: 0,
                      scale: isActive ? 1 : 0.985,
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="rounded-[1.45rem] border px-4 py-4"
                    style={{
                      borderColor: isActive ? visual.rim : 'rgba(15,23,42,0.06)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(23,24,28,0.98) 0%, rgba(34,38,46,0.96) 100%)'
                        : 'rgba(255,255,255,0.72)',
                      boxShadow: isActive
                        ? `0 16px 30px ${visual.shadow}`
                        : '0 10px 22px rgba(15,23,42,0.05)',
                    }}
                  >
                    <div className="flex gap-3">
                      <span
                        className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: isActive ? visual.accent : 'rgba(23,24,28,0.34)' }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p
                        className={`text-[15px] leading-7 ${
                          isActive
                            ? 'font-medium text-white'
                            : isPast
                            ? 'text-black/62'
                            : 'text-black/46'
                        }`}
                      >
                        {paragraph}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sleepcast-dark-dock mt-4 rounded-[2rem] px-4 py-4 text-white">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/58">
            <span>{getThemeName(t, theme)}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-1.5 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45 }}
              style={{
                background: `linear-gradient(90deg, ${visual.accent} 0%, rgba(255,255,255,0.96) 100%)`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center">
            <PlayPauseButton
              isPlaying={status === 'playing'}
              onToggle={onTogglePlay}
              iconSize={28}
              variant="solid"
            />
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

/** Theme selection screen */
function ThemeGrid({
  onSelect,
  isConfigured,
  dailyStories,
  storiesLoading,
  onRetry,
}: {
  onSelect: (theme: SleepcastTheme) => void;
  isConfigured: boolean;
  dailyStories: GeneratedSleepcast[];
  storiesLoading: boolean;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const [activeThemeId, setActiveThemeId] = useState(SLEEPCAST_THEMES[0].id);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const syncingCarouselRef = useRef(false);

  const filteredThemes = SLEEPCAST_THEMES;

  const activeTheme = filteredThemes.find((theme) => theme.id === activeThemeId)
    ?? filteredThemes[0]
    ?? SLEEPCAST_THEMES.find((theme) => theme.id === activeThemeId)
    ?? SLEEPCAST_THEMES[0];

  const storiesReady = dailyStories.length > 0;
  const activeThemeIndex = filteredThemes.findIndex((theme) => theme.id === activeTheme.id);

  useEffect(() => {
    const chipIndex = SLEEPCAST_THEMES.findIndex((theme) => theme.id === activeTheme.id);
    if (chipIndex >= 0) {
      chipRefs.current[chipIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTheme.id]);

  useEffect(() => {
    if (syncingCarouselRef.current) {
      syncingCarouselRef.current = false;
      return;
    }

    const cardIndex = filteredThemes.findIndex((theme) => theme.id === activeTheme.id);
    if (cardIndex >= 0) {
      cardRefs.current[cardIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTheme.id, filteredThemes]);

  const handleCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container || filteredThemes.length === 0) return;

    let nearestIndex = 0;
    let smallestDelta = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((node, index) => {
      if (!node || index >= filteredThemes.length) return;
      const cardCenter = node.offsetLeft + node.offsetWidth / 2;
      const containerCenter = container.scrollLeft + container.clientWidth / 2;
      const delta = Math.abs(cardCenter - containerCenter);
      if (delta < smallestDelta) {
        smallestDelta = delta;
        nearestIndex = index;
      }
    });

    const nextId = filteredThemes[nearestIndex]?.id;
    if (nextId && nextId !== activeThemeId) {
      syncingCarouselRef.current = true;
      setActiveThemeId(nextId);
    }
  };

  return (
    <motion.div
      {...screenTransition}
      className="flex flex-1 flex-col"
    >
      <ScreenFrame
        theme={activeTheme}
        bottomPadding="calc(7rem + env(safe-area-inset-bottom))"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[1.85rem] font-semibold leading-none tracking-[-0.05em] text-[#17181c]">
              {t('sleepcastGreeting')}
            </p>
            <p className="mt-1 text-sm text-black/46">
              {t('sleepcastGreetingSubline')}
            </p>
          </div>

          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/70 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
            <img
              src={activeTheme.imageUrl}
              alt={getThemeName(t, activeTheme)}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
          <div className="sleepcast-frost-card rounded-full px-3 py-1.5 text-[11px] font-semibold text-black/44">
            {t('sleepcastStoriesReady', { count: dailyStories.length })}
          </div>
          {storiesLoading && (
            <div className="sleepcast-frost-card flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-black/44">
              <Loader2 size={12} className="animate-spin" />
              <span>{t('sleepcastGenerating')}</span>
            </div>
          )}
          {!isConfigured && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-100/80 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shadow-[0_10px_22px_rgba(251,191,36,0.14)]">
              <WifiOff size={12} />
              <span>{t('sleepcastOffline')}</span>
            </div>
          )}
          {!isConfigured && onRetry && (
            <button
              onClick={onRetry}
              disabled={storiesLoading}
              type="button"
              className="sleepcast-frost-card flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold text-black/44 transition-transform active:scale-95 disabled:opacity-45"
            >
              <RefreshCw size={12} className={storiesLoading ? 'animate-spin' : ''} />
              <span>{t('sleepcastTryAgain')}</span>
            </button>
          )}
        </div>

        <div className="mt-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-black/34">
            {t('sleepcastAiPowered')}
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <h1 className="max-w-[14rem] text-[2rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#17181c]">
              {t('sleepcastSelectScene')}
            </h1>
            <div className="rounded-full bg-[#1d1f24] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {String(activeThemeIndex + 1).padStart(2, '0')} / {String(filteredThemes.length).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="mt-4 -mx-5 no-scrollbar overflow-x-auto pb-1">
          <div className="flex gap-2 pl-5">
            {SLEEPCAST_THEMES.map((theme, index) => {
              const isActive = theme.id === activeTheme.id;

              return (
                <button
                  key={theme.id}
                  ref={(node) => {
                    chipRefs.current[index] = node;
                  }}
                  onClick={() => setActiveThemeId(theme.id)}
                  type="button"
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1d1f24] text-white'
                      : 'sleepcast-flat-pill text-black/54'
                  }`}
                >
                  {getThemeName(t, theme)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 -mx-5">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="no-scrollbar flex w-full snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden pb-8"
            style={{ scrollPaddingInline: '6%' }}
          >
            {filteredThemes.map((theme, index) => {
              const isActive = theme.id === activeTheme.id;
              const distance = Math.abs(index - activeThemeIndex);
              const story = dailyStories.find((item) => item.themeId === theme.id);
              const themeCanSelect = isConfigured && (!!story || !storiesReady);
              const themeVisual = getSceneVisual(theme.id);
              const themeTitle = story?.title || getThemeName(t, theme);
              const themeDescription = story ? getThemeSummary(theme) : t('sleepcastTapToGenerate');

              return (
                <button
                  key={theme.id}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  onClick={() => {
                    if (!isActive) {
                      setActiveThemeId(theme.id);
                      return;
                    }

                    if (themeCanSelect) {
                      onSelect(theme);
                    }
                  }}
                  type="button"
                  className={`sleepcast-story-card relative aspect-[0.72] w-[88%] shrink-0 snap-center overflow-hidden rounded-[2.4rem] text-left transition-all duration-300 ${
                    isActive
                      ? 'translate-y-0 scale-100 opacity-100'
                      : distance === 1
                      ? '-translate-y-3 scale-[0.86] opacity-80'
                      : '-translate-y-7 scale-[0.78] opacity-58'
                  } ${
                    themeCanSelect ? 'active:scale-[0.988]' : 'cursor-not-allowed'
                  }`}
                  style={{
                    marginLeft: index === 0 ? '6%' : '-26%',
                    marginRight: index === filteredThemes.length - 1 ? '6%' : undefined,
                    boxShadow: isActive
                      ? `inset 0 0 0 1px ${themeVisual.rim}, inset 0 1px 0 rgba(255,255,255,0.12)`
                      : 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
                    zIndex: isActive ? filteredThemes.length + 1 : filteredThemes.length - distance,
                  }}
                >
                  <img
                    src={theme.imageUrl}
                    alt={themeTitle}
                    className="absolute inset-0 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/82 via-black/44 to-transparent" />
                  <div
                    className="absolute inset-0"
                    style={{ boxShadow: `inset 0 0 0 1px ${themeVisual.rim}` }}
                  />
                  <div
                    className="absolute -left-10 top-[18%] h-40 w-40 rounded-full blur-3xl"
                    style={{ background: `radial-gradient(circle, ${themeVisual.halo} 0%, transparent 72%)` }}
                  />
                  <div
                    className="absolute -right-8 top-[-1rem] h-44 w-44 rounded-full blur-3xl"
                    style={{ background: `radial-gradient(circle, ${themeVisual.haze} 0%, transparent 72%)` }}
                  />

                  <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
                      {getThemeName(t, theme)}
                    </p>
                    <h2 className="mt-2 max-w-[13rem] text-[2rem] font-semibold leading-[0.95] tracking-[-0.05em] text-white">
                      {themeTitle}
                    </h2>
                    <p className="mt-3 max-w-[15rem] text-sm leading-5 text-white/72 line-clamp-2">
                      {themeDescription}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

function ErrorView({
  theme,
  message,
  onStop,
}: {
  theme: SleepcastTheme;
  message: string;
  onStop: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <ScreenFrame theme={theme}>
        <div className="my-auto w-full rounded-[2rem] p-8 text-center sleepcast-frost-card">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#17181c] text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
            <AlertCircle size={24} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/34">
            {t('sleepcast')}
          </p>
          <h2 className="mt-2 text-[2rem] font-semibold leading-[0.96] tracking-[-0.045em] text-[#17181c]">
            {getThemeName(t, theme)}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-black/56">
            {message}
          </p>
          <button
            onClick={onStop}
            type="button"
            className="sleepcast-dark-dock mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            {t('sleepcastTryAgain')}
            <ChevronRight size={16} />
          </button>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

export function SleepcastScreen({
  status,
  currentCast,
  currentTheme,
  activeParagraph,
  error,
  isConfigured,
  dailyStories,
  storiesLoading,
  onStartSleepcast,
  onTogglePlay,
  onStop,
  onRetry,
}: SleepcastScreenProps) {
  const { t } = useTranslation();
  const fallbackTheme = currentTheme ?? SLEEPCAST_THEMES[0];

  return (
    <AnimatePresence mode="wait">
      {status === 'generating' && currentTheme && !currentCast && (
        <motion.div
          key="generating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col"
        >
          <LoadingView theme={currentTheme} />
        </motion.div>
      )}

      {(status === 'playing' || status === 'paused') && currentCast && currentTheme && (
        <motion.div
          key="playback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-1 flex-col"
        >
          <PlaybackView
            cast={currentCast}
            theme={currentTheme}
            activeParagraph={activeParagraph}
            status={status}
            onTogglePlay={onTogglePlay}
            onStop={onStop}
          />
        </motion.div>
      )}

      {status === 'error' && (
        <ErrorView
          key="error"
          theme={fallbackTheme}
          message={error || t('sleepcastError')}
          onStop={onStop}
        />
      )}

      {(status === 'idle' || status === 'ready') && (
        <ThemeGrid
          key="grid"
          onSelect={onStartSleepcast}
          isConfigured={isConfigured}
          dailyStories={dailyStories}
          storiesLoading={storiesLoading}
          onRetry={onRetry}
        />
      )}
    </AnimatePresence>
  );
}
