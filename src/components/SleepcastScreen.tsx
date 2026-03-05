import React, { useRef, useState, useCallback } from 'react';
import {
  Square, Loader2, AlertCircle,
  Sparkles, WifiOff, RefreshCw, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { screenTransition } from '../utils/animations';
import { SLEEPCAST_THEMES } from '../data/sleepcastThemes';
import type { SleepcastTheme, SleepcastStatus, GeneratedSleepcast } from '../types';
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

/** Loading view shown while fetching story from server */
function LoadingView({ theme }: { theme: SleepcastTheme }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Header with theme image */}
      <div className="relative shrink-0" style={{ height: '30%' }}>
        <img
          src={theme.imageUrl}
          alt={theme.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-bg-dark via-bg-dark/70 to-transparent" />
        <AmbientParticles count={5} minLeft={15} maxLeft={85} minSize={3} maxSize={8} minDuration={8} maxDuration={18} maxDelay={8} />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 size={14} className="text-primary animate-spin" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">
              {t('sleepcastGenerating')}
            </p>
          </div>
          <p className="text-xs text-foreground/40">{t('sleepcastGeneratingDesc')}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
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
  const progress = cast.paragraphs.length > 0
    ? ((activeParagraph + 1) / cast.paragraphs.length) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Hero header */}
      <div className="relative shrink-0" style={{ height: '30%' }}>
        <img
          src={theme.imageUrl}
          alt={cast.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-bg-dark via-bg-dark/70 to-transparent" />
        <AmbientParticles count={5} minLeft={15} maxLeft={85} minSize={3} maxSize={8} minDuration={8} maxDuration={18} maxDelay={8} />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">
              {t('sleepcast')}
            </p>
          </div>
          <h1 className="text-xl font-extrabold leading-tight text-foreground">{cast.title}</h1>
        </div>
      </div>

      {/* Story text */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 no-scrollbar">
        <div className="space-y-4 py-4">
          {cast.paragraphs.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: i <= activeParagraph ? 1 : 0.25,
              }}
              transition={{ duration: 0.8 }}
              className={`text-sm leading-relaxed transition-all duration-700 ${
                i === activeParagraph
                  ? 'text-foreground font-medium'
                  : i < activeParagraph
                  ? 'text-foreground/50'
                  : 'text-foreground/25'
              }`}
            >
              {para}
            </motion.p>
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {/* Progress */}
        <div className="mb-4 space-y-1.5">
          <div className="h-1 w-full bg-foreground/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary/70 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-foreground/30 font-bold">
            <span>{activeParagraph + 1} / {cast.paragraphs.length}</span>
            <span>{t('sleepcastParagraphs')}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onStop}
            className="p-3 rounded-full bg-foreground/5 text-foreground/40 active:scale-90 transition-all hover:bg-foreground/10"
          >
            <Square size={20} fill="currentColor" />
          </button>
          <PlayPauseButton isPlaying={status === 'playing'} onToggle={onTogglePlay} iconSize={28} />
          <div className="w-11" /> {/* spacer for centering */}
        </div>
      </div>
    </motion.div>
  );
}

/** Theme selection — full-bleed swipeable card carousel */
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
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasStory = (themeId: string) => dailyStories.some((s) => s.themeId === themeId);
  const storiesReady = dailyStories.length > 0;
  const activeTheme = SLEEPCAST_THEMES[activeIdx];

  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleScroll = useCallback(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el || !el.offsetWidth) return;
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      setActiveIdx(Math.max(0, Math.min(idx, SLEEPCAST_THEMES.length - 1)));

      // Manual snap correction: if not perfectly aligned, nudge into place
      const expectedLeft = idx * el.offsetWidth;
      if (Math.abs(el.scrollLeft - expectedLeft) > 2) {
        el.scrollTo({ left: expectedLeft, behavior: 'smooth' });
      }
    }, 120);
  }, []);

  return (
    <motion.div
      {...screenTransition}
      className="flex-1 flex flex-col min-h-0 overflow-hidden relative"
    >
      {/* Dynamic blurred background that morphs with active card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTheme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <img
            src={activeTheme.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            style={{ filter: 'blur(20px) saturate(1.2)', transform: 'scale(1.15)', willChange: 'opacity' }}
          />
          <div className="absolute inset-0 bg-bg-dark/75" />
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <div
        className="relative shrink-0 flex items-end justify-between px-6 pb-4"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))', zIndex: 10 }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles size={13} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.18em]">
              {t('sleepcastAiPowered')}
            </span>
            {storiesLoading && <Loader2 size={11} className="text-foreground/30 animate-spin" />}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('sleepcastTitle')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isConfigured && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
              <WifiOff size={11} className="text-amber-400" />
              <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">Offline</span>
            </div>
          )}
          {!isConfigured && onRetry && (
            <button
              onClick={onRetry}
              disabled={storiesLoading}
              className="p-2 rounded-full bg-white/10 text-white/60 active:scale-90 transition-all disabled:opacity-40"
            >
              <RefreshCw size={13} className={storiesLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative flex-1 flex flex-col min-h-0" style={{ zIndex: 10 }}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto no-scrollbar flex-1"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SLEEPCAST_THEMES.map((theme, i) => {
            const ready = hasStory(theme.id);
            const canSelect = isConfigured && (ready || !storiesReady);
            const story = dailyStories.find((s) => s.themeId === theme.id);

            return (
              <div
                key={theme.id}
                className="w-full shrink-0 px-5 flex flex-col justify-center"
                style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  onClick={() => canSelect && onSelect(theme)}
                  className={`relative rounded-[2rem] overflow-hidden cursor-pointer
                    ${canSelect ? 'active:scale-[0.97]' : 'opacity-40 cursor-not-allowed'}
                    transition-transform duration-200`}
                  style={{
                    height: '80dvh',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Image */}
                  <img
                    src={theme.imageUrl}
                    alt={theme.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Top highlight: shimmer border */}
                  <div
                    className="absolute inset-0 rounded-[2rem] pointer-events-none"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}
                  />

                  {/* Top badge */}
                  {ready && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-extrabold text-white uppercase tracking-wider">Ready</span>
                      </div>
                    </div>
                  )}

                  {/* Center play icon */}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                    <div className="w-16 h-16 rounded-full liquid-glass-play flex items-center justify-center">
                      <Play size={28} fill="currentColor" className="text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)' }}>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">
                      {t('sleepcast')}
                    </p>
                    <h2 className="text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                      {t(`sleepcastTheme_${theme.id}` as any) || theme.name}
                    </h2>
                    {story?.title ? (
                      <p className="text-sm text-white/55 leading-snug line-clamp-2">
                        {story.title}
                      </p>
                    ) : (
                      <p className="text-sm text-white/35">{t('sleepcastTapToGenerate')}</p>
                    )}
                    {!canSelect && (
                      <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 w-fit">
                        <WifiOff size={12} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-300">Offline</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Dot indicators + subtitle */}
        <div className="shrink-0 flex flex-col items-center gap-3 py-4" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-1.5">
            {SLEEPCAST_THEMES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  scrollRef.current?.scrollTo({ left: i * (scrollRef.current?.offsetWidth ?? 0), behavior: 'smooth' });
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'bg-primary w-5 h-1.5' : 'bg-white/20 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-foreground/35">{t('sleepcastSubtitle')}</p>
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

  return (
    <AnimatePresence mode="popLayout">
      {status === 'generating' && currentTheme && !currentCast && (
        <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col">
          <LoadingView theme={currentTheme} />
        </motion.div>
      )}

      {(status === 'playing' || status === 'paused') && currentCast && currentTheme && (
        <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
        <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <p className="text-sm text-center text-foreground/60">{error || t('sleepcastError')}</p>
          <button
            onClick={onStop}
            className="px-6 py-2.5 rounded-2xl bg-foreground/5 text-foreground/60 text-sm font-semibold"
          >
            {t('sleepcastTryAgain')}
          </button>
        </motion.div>
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
