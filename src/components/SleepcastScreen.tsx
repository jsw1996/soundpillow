import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Loader2, Play, RefreshCw, Sparkles, Square, WifiOff,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { SLEEPCAST_THEMES } from '../data/sleepcastThemes';
import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../types';
import { useTranslation } from '../i18n';
import { AmbientParticles } from './AmbientParticles';
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
  rim: 'rgba(155, 126, 216, 0.5)',
  halo: 'rgba(155, 126, 216, 0.3)',
  haze: 'rgba(88, 58, 156, 0.4)',
  shadow: 'rgba(9, 7, 24, 0.6)',
};

const SCENE_VISUALS: Record<string, SceneVisual> = {
  'cabin-rain': {
    accent: '#A1C1E6',
    rim: 'rgba(161, 193, 230, 0.55)',
    halo: 'rgba(98, 151, 207, 0.34)',
    haze: 'rgba(230, 171, 103, 0.18)',
    shadow: 'rgba(14, 24, 40, 0.65)',
  },
  'ocean-voyage': {
    accent: '#76D5E8',
    rim: 'rgba(118, 213, 232, 0.55)',
    halo: 'rgba(63, 167, 209, 0.32)',
    haze: 'rgba(197, 229, 248, 0.14)',
    shadow: 'rgba(6, 21, 39, 0.68)',
  },
  'enchanted-forest': {
    accent: '#74D39D',
    rim: 'rgba(116, 211, 157, 0.5)',
    halo: 'rgba(86, 183, 120, 0.3)',
    haze: 'rgba(195, 255, 214, 0.12)',
    shadow: 'rgba(8, 24, 19, 0.68)',
  },
  'zen-garden': {
    accent: '#E4C8A7',
    rim: 'rgba(228, 200, 167, 0.45)',
    halo: 'rgba(226, 181, 126, 0.25)',
    haze: 'rgba(189, 223, 190, 0.16)',
    shadow: 'rgba(24, 18, 14, 0.58)',
  },
  stargazing: {
    accent: '#B6C5FF',
    rim: 'rgba(182, 197, 255, 0.55)',
    halo: 'rgba(126, 154, 255, 0.34)',
    haze: 'rgba(255, 234, 164, 0.14)',
    shadow: 'rgba(8, 12, 34, 0.72)',
  },
  'snow-lodge': {
    accent: '#E9F0FF',
    rim: 'rgba(233, 240, 255, 0.55)',
    halo: 'rgba(173, 204, 255, 0.22)',
    haze: 'rgba(255, 204, 138, 0.12)',
    shadow: 'rgba(15, 20, 34, 0.6)',
  },
};

function getSceneVisual(themeId: string): SceneVisual {
  return SCENE_VISUALS[themeId] ?? DEFAULT_VISUAL;
}

function getThemeName(t: ReturnType<typeof useTranslation>['t'], theme: SleepcastTheme) {
  return t(`sleepcastTheme_${theme.id}` as any) || theme.name;
}

function SceneBackdrop({ theme }: { theme: SleepcastTheme }) {
  const visual = getSceneVisual(theme.id);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img
            src={theme.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            style={{
              filter: 'blur(20px) saturate(1.15) brightness(0.7)',
              transform: 'scale(1.12)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute -left-20 top-[14%] h-72 w-72 rounded-full blur-3xl"
        animate={{ x: [0, 18, -6, 0], y: [0, -20, 12, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 70%)` }}
      />
      <motion.div
        className="absolute -right-24 bottom-[6%] h-96 w-96 rounded-full blur-3xl"
        animate={{ x: [0, -12, 8, 0], y: [0, 14, -18, 0], scale: [1, 0.94, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(circle, ${visual.haze} 0%, transparent 72%)` }}
      />

      <div className="sleepcast-noise absolute inset-0" />
      <div className="sleepcast-vignette absolute inset-0" />
      <AmbientParticles count={5} minLeft={12} maxLeft={88} minSize={3} maxSize={6} minDuration={12} maxDuration={22} maxDelay={8} />
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
      className="relative flex flex-1 flex-col overflow-hidden"
    >
      <SceneBackdrop theme={theme} />

      <div
        className="relative z-10 flex flex-1 flex-col px-6"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] text-white/55">
          <Sparkles size={13} style={{ color: visual.accent }} />
          <span>{t('sleepcastAiPowered')}</span>
        </div>

        <div className="my-auto flex flex-col items-center text-center">
          <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 72%)` }}
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-black/30">
              <Loader2 size={30} className="animate-spin" style={{ color: visual.accent }} />
            </div>
          </div>

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.36em] text-white/45">
            {t('sleepcastGenerating')}
          </p>
          <h1 className="sleepcast-display max-w-xs text-5xl leading-[0.9] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
            {getThemeName(t, theme)}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/62">
            {t('sleepcastGeneratingDesc')}
          </p>

          <div className="mt-8 flex items-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                className="rounded-full"
                animate={{ height: [10, 26, 10], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12 }}
                style={{
                  width: 5,
                  background: visual.accent,
                  boxShadow: `0 0 20px ${visual.halo}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      className="relative flex flex-1 flex-col overflow-hidden"
    >
      <SceneBackdrop theme={theme} />

      <div
        className="relative z-10 flex flex-1 flex-col px-5"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="sleepcast-chip flex items-center gap-2 rounded-full px-3 py-1.5">
            <Sparkles size={12} style={{ color: visual.accent }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/58">
              {t('sleepcast')}
            </span>
          </div>
          <div className="sleepcast-chip rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/52">
            {Math.max(activeParagraph + 1, 1)} / {cast.paragraphs.length}
          </div>
        </div>

        <div className="mb-5 px-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/44">
            {getThemeName(t, theme)}
          </p>
          <h1 className="sleepcast-display text-[2.9rem] leading-[0.88] text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
            {cast.title}
          </h1>
        </div>

        <div className="sleepcast-reading-shell relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/8 p-3">
          <div
            ref={scrollContainerRef}
            className="no-scrollbar flex-1 overflow-y-auto px-1 py-1"
          >
            <div className="space-y-3 pb-2">
              {cast.paragraphs.map((paragraph, index) => {
                const isActive = index === activeParagraph;
                const isPast = index < activeParagraph;

                return (
                  <motion.div
                    key={index}
                    ref={(node) => {
                      paragraphRefs.current[index] = node;
                    }}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{
                      opacity: isActive ? 1 : isPast ? 0.6 : 0.34,
                      y: 0,
                      scale: isActive ? 1 : 0.985,
                    }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="rounded-[1.4rem] border px-4 py-4"
                    style={{
                      borderColor: isActive ? visual.rim : 'rgba(255,255,255,0.06)',
                      background: isActive
                        ? `linear-gradient(135deg, ${visual.shadow} 0%, rgba(255,255,255,0.04) 100%)`
                        : 'rgba(255,255,255,0.015)',
                      boxShadow: isActive ? `0 14px 34px ${visual.shadow}` : 'none',
                    }}
                  >
                    <div className="flex gap-3">
                      <span
                        className="mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: isActive ? visual.accent : 'rgba(255,255,255,0.3)' }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p
                        className={`text-[15px] leading-7 ${
                          isActive
                            ? 'font-medium text-white'
                            : isPast
                            ? 'text-white/58'
                            : 'text-white/38'
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

        <div className="sleepcast-control-dock mt-4 rounded-[1.8rem] border border-white/8 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
            <span>{getThemeName(t, theme)}</span>
            <span>{cast.paragraphs.length} {t('sleepcastParagraphs')}</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-1.5 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              style={{
                background: `linear-gradient(90deg, ${visual.accent} 0%, rgba(255,255,255,0.9) 100%)`,
                boxShadow: `0 0 24px ${visual.halo}`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-5">
            <button
              onClick={onStop}
              className="sleepcast-chip flex h-12 w-12 items-center justify-center rounded-full text-white/70 transition-all active:scale-90"
              type="button"
            >
              <Square size={18} fill="currentColor" />
            </button>
            <PlayPauseButton isPlaying={status === 'playing'} onToggle={onTogglePlay} iconSize={28} variant="solid" />
            <div className="w-12" />
          </div>
        </div>
      </div>
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
  const { locale, t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeTheme = SLEEPCAST_THEMES[activeIdx];
  const visual = getSceneVisual(activeTheme.id);
  const storiesReady = dailyStories.length > 0;
  const activeStory = dailyStories.find((story) => story.themeId === activeTheme.id);
  const canSelect = isConfigured && (!!activeStory || !storiesReady);
  const formattedDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(new Date()),
    [locale],
  );

  useEffect(() => {
    cardRefs.current[activeIdx]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIdx]);

  return (
    <motion.div
      {...screenTransition}
      className="relative flex flex-1 flex-col overflow-hidden"
    >
      <SceneBackdrop theme={activeTheme} />

      <div
        className="relative z-10 flex flex-1 flex-col px-5"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/55">
              <Sparkles size={13} style={{ color: visual.accent }} />
              <span>{t('sleepcastAiPowered')}</span>
              {storiesLoading && <Loader2 size={12} className="animate-spin text-white/45" />}
            </div>
            <h1 className="sleepcast-display text-5xl leading-[0.88] text-white">
              {t('sleepcastTitle')}
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/58">
              {t('sleepcastSubtitle')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="sleepcast-chip rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
              {formattedDate}
            </div>
            {!isConfigured && (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5">
                <WifiOff size={11} className="text-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100">
                  {t('sleepcastOffline')}
                </span>
              </div>
            )}
            {!isConfigured && onRetry && (
              <button
                onClick={onRetry}
                disabled={storiesLoading}
                className="sleepcast-chip flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition-all active:scale-90 disabled:opacity-40"
                type="button"
              >
                <RefreshCw size={14} className={storiesLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <motion.button
            key={activeTheme.id}
            onClick={() => canSelect && onSelect(activeTheme)}
            disabled={!canSelect}
            type="button"
            className={`sleepcast-stage-card relative min-h-[23rem] w-full overflow-hidden rounded-[2.4rem] text-left ${
              canSelect ? 'active:scale-[0.985]' : 'cursor-not-allowed opacity-85'
            } transition-transform duration-200`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTheme.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <img
                  src={activeTheme.imageUrl}
                  alt={getThemeName(t, activeTheme)}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(6, 10, 18, 0.08) 0%, rgba(8, 12, 20, 0.25) 30%, ${visual.shadow} 100%)`,
                  }}
                />
                <div className="sleepcast-noise absolute inset-0 opacity-75" />
                <div
                  className="absolute -left-14 top-[22%] h-40 w-40 rounded-full blur-3xl"
                  style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 72%)` }}
                />
                <div
                  className="absolute right-[-2.5rem] top-[-1.5rem] h-56 w-56 rounded-full blur-3xl"
                  style={{ background: `radial-gradient(circle, ${visual.haze} 0%, transparent 72%)` }}
                />
              </motion.div>
            </AnimatePresence>

            <div
              className="absolute inset-0 rounded-[2.4rem]"
              style={{ boxShadow: `inset 0 0 0 1px ${visual.rim}` }}
            />

            <div className="absolute left-5 right-5 top-5 z-10 flex items-start justify-between gap-3">
              <div className="sleepcast-chip rounded-full px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">
                  {t('sleepcast')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeStory && (
                  <div className="sleepcast-chip flex items-center gap-1.5 rounded-full px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: visual.accent }} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/72">
                      {t('sleepcastReady')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 p-6">
              <div className="flex items-end gap-4">
                <div className="min-w-0 flex-1">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                    {t('sleepcastSelectScene')}
                  </p>
                  <h2 className="sleepcast-display text-[3.25rem] leading-[0.86] text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
                    {getThemeName(t, activeTheme)}
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/68 line-clamp-2">
                    {activeStory?.title || (!storiesReady ? t('sleepcastTapToGenerate') : t('sleepcastSubtitle'))}
                  </p>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    {t('sleepcastStoriesReady', { count: dailyStories.length })}
                  </p>
                </div>

                <div className="relative shrink-0">
                  <div
                    className="absolute inset-[-10px] rounded-full blur-2xl"
                    style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 72%)` }}
                  />
                  <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/10 bg-white text-[#10131d] shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
                    {storiesLoading ? (
                      <Loader2 size={26} className="animate-spin" />
                    ) : (
                      <Play size={26} fill="currentColor" className="ml-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.button>

          <div className="sleepcast-gallery-shell mt-5 rounded-[2rem] border border-white/8 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/42">
                  {t('sleepcastSelectScene')}
                </p>
                <p className="mt-1 text-sm text-white/64">
                  {t('sleepcastStoriesReady', { count: dailyStories.length })}
                </p>
              </div>
              <div className="sleepcast-chip rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/42">
                {activeIdx + 1} / {SLEEPCAST_THEMES.length}
              </div>
            </div>

            <div className="no-scrollbar overflow-x-auto pb-1">
              <div className="flex gap-3">
                {SLEEPCAST_THEMES.map((theme, index) => {
                  const isActive = index === activeIdx;
                  const story = dailyStories.find((item) => item.themeId === theme.id);
                  const cardVisual = getSceneVisual(theme.id);

                  return (
                    <motion.button
                      key={theme.id}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      onClick={() => setActiveIdx(index)}
                      type="button"
                      animate={{
                        y: isActive ? -4 : 0,
                        scale: isActive ? 1 : 0.95,
                        opacity: isActive ? 1 : 0.72,
                      }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="relative h-52 w-36 shrink-0 overflow-hidden rounded-[1.6rem] text-left"
                      style={{
                        boxShadow: isActive
                          ? `0 20px 50px ${cardVisual.shadow}, inset 0 0 0 1px ${cardVisual.rim}`
                          : '0 14px 32px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.06)',
                      }}
                    >
                      <img
                        src={theme.imageUrl}
                        alt={getThemeName(t, theme)}
                        className="absolute inset-0 h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/12 to-black/70" />
                      <div className="sleepcast-noise absolute inset-0 opacity-70" />

                      <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/52">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {story && (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/20"
                            style={{ background: cardVisual.accent }}
                          />
                        )}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="sleepcast-display text-2xl leading-[0.92] text-white">
                          {getThemeName(t, theme)}
                        </p>
                        <p className="mt-2 text-[11px] leading-4 text-white/55 line-clamp-2">
                          {story?.title || t('sleepcastTapToGenerate')}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
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
  const visual = getSceneVisual(theme.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex flex-1 flex-col overflow-hidden"
    >
      <SceneBackdrop theme={theme} />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <div className="sleepcast-gallery-shell w-full max-w-sm rounded-[2rem] border border-white/8 p-8 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10"
          >
            <AlertCircle size={24} className="text-red-300" />
          </div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/42">
            {t('sleepcast')}
          </p>
          <h2 className="sleepcast-display text-4xl leading-[0.92] text-white">
            {getThemeName(t, theme)}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/64">
            {message}
          </p>
          <button
            onClick={onStop}
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${visual.accent} 0%, rgba(255,255,255,0.18) 100%)`,
              boxShadow: `0 18px 40px ${visual.shadow}`,
            }}
          >
            {t('sleepcastTryAgain')}
          </button>
        </div>
      </div>
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
