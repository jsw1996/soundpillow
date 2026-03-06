import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Plus,
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
  card: string;
  cardInk: string;
  sticker: string;
  stickerInk: string;
}

type ThemeFilter = 'all' | 'ready' | 'generate' | 'offline';

const DEFAULT_VISUAL: SceneVisual = {
  accent: '#7A63D4',
  rim: 'rgba(122, 99, 212, 0.18)',
  halo: 'rgba(122, 99, 212, 0.20)',
  haze: 'rgba(255, 208, 129, 0.18)',
  shadow: 'rgba(40, 34, 82, 0.22)',
  card: 'linear-gradient(135deg, #f4df6b 0%, #f2c94c 100%)',
  cardInk: '#6d3600',
  sticker: '#ffffff',
  stickerInk: '#17181c',
};

const SCENE_VISUALS: Record<string, SceneVisual> = {
  'cabin-rain': {
    accent: '#7e5d46',
    rim: 'rgba(126, 93, 70, 0.18)',
    halo: 'rgba(126, 93, 70, 0.16)',
    haze: 'rgba(255, 210, 145, 0.18)',
    shadow: 'rgba(67, 42, 24, 0.22)',
    card: 'linear-gradient(135deg, #f4dd53 0%, #f1bf10 100%)',
    cardInk: '#86411d',
    sticker: '#ffffff',
    stickerInk: '#3a2415',
  },
  'ocean-voyage': {
    accent: '#3b8fbb',
    rim: 'rgba(59, 143, 187, 0.18)',
    halo: 'rgba(59, 143, 187, 0.16)',
    haze: 'rgba(220, 241, 251, 0.20)',
    shadow: 'rgba(20, 58, 90, 0.22)',
    card: 'linear-gradient(135deg, #74d2f2 0%, #3a89c9 100%)',
    cardInk: '#0f3652',
    sticker: '#fefefe',
    stickerInk: '#173c56',
  },
  'enchanted-forest': {
    accent: '#4c9867',
    rim: 'rgba(76, 152, 103, 0.18)',
    halo: 'rgba(76, 152, 103, 0.16)',
    haze: 'rgba(214, 250, 221, 0.18)',
    shadow: 'rgba(27, 68, 40, 0.22)',
    card: 'linear-gradient(135deg, #89da83 0%, #3e8e64 100%)',
    cardInk: '#133f2b',
    sticker: '#fff8ed',
    stickerInk: '#224d38',
  },
  'zen-garden': {
    accent: '#b78453',
    rim: 'rgba(183, 132, 83, 0.18)',
    halo: 'rgba(183, 132, 83, 0.16)',
    haze: 'rgba(242, 230, 214, 0.18)',
    shadow: 'rgba(92, 58, 24, 0.2)',
    card: 'linear-gradient(135deg, #edd5b4 0%, #c89f77 100%)',
    cardInk: '#68472a',
    sticker: '#fffaf2',
    stickerInk: '#62452b',
  },
  stargazing: {
    accent: '#536fda',
    rim: 'rgba(83, 111, 218, 0.18)',
    halo: 'rgba(83, 111, 218, 0.16)',
    haze: 'rgba(232, 237, 255, 0.20)',
    shadow: 'rgba(24, 31, 72, 0.24)',
    card: 'linear-gradient(135deg, #1d2237 0%, #060913 100%)',
    cardInk: '#eef1ff',
    sticker: '#f7f7fb',
    stickerInk: '#171c33',
  },
  'snow-lodge': {
    accent: '#8f9fc6',
    rim: 'rgba(143, 159, 198, 0.18)',
    halo: 'rgba(143, 159, 198, 0.16)',
    haze: 'rgba(255, 255, 255, 0.24)',
    shadow: 'rgba(34, 46, 77, 0.2)',
    card: 'linear-gradient(135deg, #dde7f8 0%, #bac7de 100%)',
    cardInk: '#30415f',
    sticker: '#ffffff',
    stickerInk: '#324869',
  },
};

const THEME_EMOJIS: Record<string, string[]> = {
  'cabin-rain': ['🔥', '🌧️', '🪵'],
  'ocean-voyage': ['🌊', '⛵️', '💫'],
  'enchanted-forest': ['🌿', '🪲', '✨'],
  'zen-garden': ['🍵', '🪨', '🌸'],
  stargazing: ['🌙', '⭐️', '🛸'],
  'snow-lodge': ['❄️', '☕️', '🧣'],
};

function getSceneVisual(themeId: string): SceneVisual {
  return SCENE_VISUALS[themeId] ?? DEFAULT_VISUAL;
}

function getThemeName(t: ReturnType<typeof useTranslation>['t'], theme: SleepcastTheme) {
  return t(`sleepcastTheme_${theme.id}` as any) || theme.name;
}

function getThemeSummary(theme: SleepcastTheme) {
  const firstSentence = theme.prompt.replace(/\s+/g, ' ').split('. ')[0]?.trim() ?? theme.prompt;
  return firstSentence.length > 96 ? `${firstSentence.slice(0, 93)}...` : firstSentence;
}

function formatCardDate(timestamp: number) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const stamp = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;

  return { day, stamp };
}

function getFilterLabel(t: ReturnType<typeof useTranslation>['t'], filter: ThemeFilter) {
  switch (filter) {
    case 'ready':
      return t('sleepcastFilterReady');
    case 'generate':
      return t('sleepcastFilterGenerate');
    case 'offline':
      return t('sleepcastFilterOffline');
    default:
      return t('sleepcastFilterAll');
  }
}

function PaperBackdrop({ theme }: { theme: SleepcastTheme }) {
  const visual = getSceneVisual(theme.id);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f1d7_0%,#f7f2e6_44%,#fff8f0_100%)]" />
      <div
        className="absolute inset-x-6 top-28 h-40 rounded-[3rem] opacity-70 blur-3xl"
        style={{ background: `radial-gradient(circle, ${visual.haze} 0%, transparent 72%)` }}
      />
      <div
        className="absolute -right-12 top-36 h-44 w-44 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${visual.halo} 0%, transparent 72%)` }}
      />
      <div
        className="absolute -left-10 bottom-32 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${visual.rim} 0%, transparent 72%)` }}
      />
      <div className="absolute inset-x-5 top-[11.75rem] h-px bg-black/5" />
      <div className="absolute right-8 top-[20rem] grid grid-cols-6 gap-2 opacity-25">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} className="h-1 w-1 rounded-full bg-black/20" />
        ))}
      </div>
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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#fbf5ea] text-[#17181c]">
      <PaperBackdrop theme={theme} />
      <div
        className="relative z-10 flex flex-1 flex-col px-5"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: bottomPadding,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HeaderBadge({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative h-[4.4rem] w-[4.4rem] overflow-hidden rounded-[1.15rem] border border-white/70 bg-white shadow-[0_14px_30px_rgba(23,24,28,0.09)]">
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
    </div>
  );
}

function ThemeArtwork({
  theme,
  visual,
  title,
  statusLabel,
}: {
  theme: SleepcastTheme;
  visual: SceneVisual;
  title: string;
  statusLabel: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex w-[42%] items-center justify-center">
      <div className="relative h-[82%] w-full">
        <div
          className="absolute right-[10%] top-[18%] h-24 w-24 rounded-full opacity-90 shadow-[0_20px_44px_rgba(0,0,0,0.24)]"
          style={{
            background: 'radial-gradient(circle at 34% 34%, rgba(255,255,255,0.15), rgba(0,0,0,0.92) 70%)',
          }}
        />
        <div className="absolute left-[6%] top-[10%] h-28 w-24 -rotate-[14deg] overflow-hidden rounded-[1rem] bg-[#17181c] shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
          <img
            src={theme.imageUrl}
            alt=""
            className="h-full w-full object-cover opacity-88"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/58" />
          <div className="absolute inset-x-2 bottom-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/88">
            {title.slice(0, 10)}
          </div>
        </div>
        <div className="absolute left-[24%] top-[30%] h-28 w-24 rotate-[10deg] overflow-hidden rounded-[1rem] bg-white shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
          <img
            src={theme.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/32" />
        </div>
        <div
          className="absolute left-[18%] top-[60%] rotate-[-10deg] rounded-[0.95rem] px-4 py-3 text-sm font-black uppercase tracking-[0.05em] shadow-[0_18px_34px_rgba(0,0,0,0.16)]"
          style={{ background: visual.sticker, color: visual.stickerInk }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
}

function LoadingView({ theme }: { theme: SleepcastTheme }) {
  const { t } = useTranslation();
  const visual = getSceneVisual(theme.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
      <ScreenFrame theme={theme}>
        <div className="flex items-center justify-between">
          <HeaderBadge imageUrl={theme.imageUrl} />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-white/65 shadow-[0_10px_24px_rgba(23,24,28,0.08)] backdrop-blur-md">
            <Sparkles size={22} style={{ color: visual.accent }} />
          </div>
        </div>

        <div className="mt-8 max-w-[16rem]">
          <p className="text-sm font-medium text-black/45">{t('sleepcastGreetingSubline')}</p>
          <h1 className="mt-3 text-[3.1rem] font-black italic leading-[0.9] tracking-[-0.08em] text-[#111217]">
            {t('sleepcastTraceTitle')}
            <span className="ml-2 align-top text-[2rem] not-italic">✨</span>
          </h1>
        </div>

        <div
          className="mt-8 rounded-[2.25rem] p-5"
          style={{ background: visual.card, boxShadow: `0 24px 50px ${visual.shadow}` }}
        >
          <div className="relative min-h-[17.5rem] overflow-hidden rounded-[1.7rem] bg-black/6 px-5 py-5">
            <div className="relative z-10 max-w-[12rem]">
              <div className="text-[11px] font-black uppercase tracking-[0.02em] opacity-55" style={{ color: visual.cardInk }}>
                {t('sleepcastGenerating')}
              </div>
              <h2 className="mt-4 text-[2.3rem] font-black leading-[0.92] tracking-[-0.06em]" style={{ color: visual.cardInk }}>
                {getThemeName(t, theme)}
              </h2>
              <p className="mt-3 text-sm leading-6 opacity-75" style={{ color: visual.cardInk }}>
                {t('sleepcastGeneratingDesc')}
              </p>
            </div>

            <ThemeArtwork
              theme={theme}
              visual={visual}
              title={getThemeName(t, theme)}
              statusLabel={t('sleepcastGenerating')}
            />

            <div className="relative z-10 mt-8 flex items-end gap-2">
              {[0, 1, 2, 3].map((index) => (
                <motion.span
                  key={index}
                  className="w-2.5 rounded-full"
                  animate={{ height: [8, 30, 10], opacity: [0.32, 1, 0.42] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12 }}
                  style={{ background: visual.cardInk }}
                />
              ))}
              <Loader2 size={18} className="ml-3 animate-spin" style={{ color: visual.cardInk }} />
            </div>
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
      <ScreenFrame theme={theme}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HeaderBadge imageUrl={theme.imageUrl} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/38">
                {status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused')}
              </p>
              <p className="mt-1 text-sm text-black/50">{getThemeName(t, theme)}</p>
            </div>
          </div>

          <button
            onClick={onStop}
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-white/65 text-[#17181c] shadow-[0_10px_24px_rgba(23,24,28,0.08)] backdrop-blur-md transition-transform active:scale-95"
          >
            <Square size={18} fill="currentColor" />
          </button>
        </div>

        <div
          className="mt-7 rounded-[2.25rem] p-5"
          style={{ background: visual.card, boxShadow: `0 24px 50px ${visual.shadow}` }}
        >
          <div className="relative min-h-[13.5rem] overflow-hidden rounded-[1.7rem] px-5 py-5">
            <div className="relative z-10 max-w-[12rem]">
              <div className="text-[11px] font-black uppercase tracking-[0.02em] opacity-55" style={{ color: visual.cardInk }}>
                {String(activeParagraph + 1).padStart(2, '0')} / {String(cast.paragraphs.length).padStart(2, '0')}
              </div>
              <h1 className="mt-4 text-[2.15rem] font-black leading-[0.92] tracking-[-0.06em]" style={{ color: visual.cardInk }}>
                {cast.title}
              </h1>
              <p className="mt-3 text-sm leading-6 opacity-72" style={{ color: visual.cardInk }}>
                {getThemeSummary(theme)}
              </p>
            </div>

            <ThemeArtwork
              theme={theme}
              visual={visual}
              title={cast.title}
              statusLabel={status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused')}
            />
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] border border-black/6 bg-white/70 p-4 shadow-[0_18px_40px_rgba(23,24,28,0.06)] backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-black/38">
            <span>{getThemeName(t, theme)}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-full bg-black/8">
            <motion.div
              className="h-2 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45 }}
              style={{ background: `linear-gradient(90deg, ${visual.accent} 0%, rgba(255,255,255,0.96) 100%)` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-black/54">
              {cast.paragraphs.length} {t('sleepcastParagraphs')}
            </div>
            <PlayPauseButton
              isPlaying={status === 'playing'}
              onToggle={onTogglePlay}
              iconSize={28}
              variant="solid"
            />
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-hidden">
          <div className="no-scrollbar flex h-full flex-col gap-3 overflow-y-auto pb-1">
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
                    opacity: isActive ? 1 : isPast ? 0.76 : 0.58,
                    y: 0,
                    scale: isActive ? 1 : 0.985,
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="rounded-[1.75rem] border px-4 py-4"
                  style={{
                    borderColor: isActive ? visual.rim : 'rgba(23,24,28,0.06)',
                    background: isActive ? '#17181c' : 'rgba(255,255,255,0.76)',
                    boxShadow: isActive
                      ? `0 18px 36px ${visual.shadow}`
                      : '0 14px 30px rgba(23,24,28,0.05)',
                    transform: isActive ? 'rotate(-1deg)' : isPast ? 'rotate(-0.4deg)' : 'rotate(0.35deg)',
                  }}
                >
                  <div className="flex gap-3">
                    <span
                      className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-[0.24em]"
                      style={{ color: isActive ? '#ffffff' : 'rgba(23,24,28,0.34)' }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className={`text-[15px] leading-7 ${isActive ? 'font-medium text-white' : isPast ? 'text-black/64' : 'text-black/48'}`}>
                      {paragraph}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

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
  const [filter, setFilter] = useState<ThemeFilter>('all');
  const [activeThemeId, setActiveThemeId] = useState(SLEEPCAST_THEMES[0]?.id ?? '');

  const storiesByTheme = useMemo(
    () => new Map(dailyStories.map((story) => [story.themeId, story])),
    [dailyStories],
  );

  const filteredThemes = useMemo(() => {
    switch (filter) {
      case 'ready':
        return SLEEPCAST_THEMES.filter((theme) => storiesByTheme.has(theme.id));
      case 'generate':
        return SLEEPCAST_THEMES.filter((theme) => !storiesByTheme.has(theme.id));
      case 'offline':
        return isConfigured ? [] : SLEEPCAST_THEMES;
      default:
        return SLEEPCAST_THEMES;
    }
  }, [filter, isConfigured, storiesByTheme]);

  useEffect(() => {
    if (!filteredThemes.some((theme) => theme.id === activeThemeId) && filteredThemes[0]) {
      setActiveThemeId(filteredThemes[0].id);
    }
  }, [activeThemeId, filteredThemes]);

  const activeTheme = filteredThemes.find((theme) => theme.id === activeThemeId)
    ?? SLEEPCAST_THEMES.find((theme) => theme.id === activeThemeId)
    ?? filteredThemes[0]
    ?? SLEEPCAST_THEMES[0];

  const storiesReady = dailyStories.length > 0;
  const filters: ThemeFilter[] = isConfigured
    ? ['all', 'ready', 'generate']
    : ['all', 'offline', 'generate'];

  return (
    <motion.div {...screenTransition} className="flex flex-1 flex-col">
      <ScreenFrame theme={activeTheme} bottomPadding="calc(6rem + env(safe-area-inset-bottom))">
        <div className="flex items-center justify-between gap-4">
          <HeaderBadge imageUrl={activeTheme.imageUrl} />
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-white/65 text-[#17181c] shadow-[0_10px_24px_rgba(23,24,28,0.08)] backdrop-blur-md transition-transform active:scale-95"
            aria-label={t('sleepcast')}
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="mt-8 max-w-[16rem]">
          <p className="text-sm font-medium text-black/45">{t('sleepcastCollectionLabel')}</p>
          <h1 className="mt-3 text-[3.25rem] font-black italic leading-[0.9] tracking-[-0.08em] text-[#111217]">
            {t('sleepcastTraceTitle')}
            <span className="ml-2 align-top text-[2rem] not-italic">✨</span>
          </h1>
        </div>

        <div className="mt-7 -mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3 px-1">
            {filters.map((item) => {
              const isActive = filter === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full border px-5 py-3 text-base font-semibold transition-all ${
                    isActive
                      ? 'border-black bg-[#111217] text-white shadow-[0_12px_28px_rgba(17,18,23,0.18)]'
                      : 'border-black/8 bg-white/55 text-black/72 shadow-[0_8px_18px_rgba(17,18,23,0.06)]'
                  }`}
                >
                  {getFilterLabel(t, item)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
          <div className="rounded-full border border-black/7 bg-white/55 px-3 py-2 shadow-[0_8px_18px_rgba(17,18,23,0.05)]">
            {t('sleepcastStoriesReady', { count: dailyStories.length })}
          </div>
          {storiesLoading && (
            <div className="flex items-center gap-2 rounded-full border border-black/7 bg-white/55 px-3 py-2 shadow-[0_8px_18px_rgba(17,18,23,0.05)]">
              <Loader2 size={12} className="animate-spin" />
              <span>{t('sleepcastGenerating')}</span>
            </div>
          )}
          {!isConfigured && (
            <div className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/90 px-3 py-2 text-amber-900 shadow-[0_8px_18px_rgba(245,158,11,0.10)]">
              <WifiOff size={12} />
              <span>{t('sleepcastOffline')}</span>
            </div>
          )}
          {!isConfigured && onRetry && (
            <button
              onClick={onRetry}
              disabled={storiesLoading}
              type="button"
              className="flex items-center gap-2 rounded-full border border-black/7 bg-white/55 px-3 py-2 shadow-[0_8px_18px_rgba(17,18,23,0.05)] transition-transform active:scale-95 disabled:opacity-45"
            >
              <RefreshCw size={12} className={storiesLoading ? 'animate-spin' : ''} />
              <span>{t('sleepcastTryAgain')}</span>
            </button>
          )}
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-hidden">
          {filteredThemes.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-black/10 bg-white/45 p-6 text-center text-black/48">
              {t('sleepcastNoResults')}
            </div>
          ) : (
            <div className="no-scrollbar flex h-full flex-col gap-4 overflow-y-auto pb-1">
              {filteredThemes.map((theme, index) => {
                const visual = getSceneVisual(theme.id);
                const story = storiesByTheme.get(theme.id);
                const isActive = theme.id === activeThemeId;
                const themeCanSelect = isConfigured && (!!story || !storiesReady);
                const cardDate = formatCardDate(story?.createdAt ?? Date.now() - index * 86400000);
                const displayTitle = story?.title ?? getThemeName(t, theme);
                const displayMeta = story
                  ? `${story.paragraphs.length} ${t('sleepcastParagraphs')}`
                  : t('sleepcastTapToGenerate');
                const statusLabel = story
                  ? t('sleepcastAvailableNow')
                  : themeCanSelect
                  ? t('sleepcastGenerateNow')
                  : t('sleepcastOffline');
                const emojis = THEME_EMOJIS[theme.id] ?? ['✨', '🌙', '🎧'];

                return (
                  <motion.button
                    key={theme.id}
                    type="button"
                    whileTap={{ scale: 0.988 }}
                    onClick={() => {
                      if (!isActive) {
                        setActiveThemeId(theme.id);
                        return;
                      }

                      if (themeCanSelect) {
                        onSelect(theme);
                      }
                    }}
                    className={`relative overflow-hidden rounded-[2.4rem] px-5 py-5 text-left transition-all ${isActive ? 'scale-[1.01]' : ''} ${themeCanSelect || !isActive ? '' : 'cursor-not-allowed'}`}
                    style={{
                      background: visual.card,
                      minHeight: 248,
                      boxShadow: isActive
                        ? `0 26px 50px ${visual.shadow}`
                        : '0 18px 34px rgba(23,24,28,0.10)',
                      transform: isActive
                        ? 'rotate(-1deg)'
                        : index % 3 === 0
                        ? 'rotate(-0.8deg)'
                        : index % 3 === 1
                        ? 'rotate(0.9deg)'
                        : 'rotate(-0.35deg)',
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage: 'radial-gradient(currentColor 0.8px, transparent 0.8px)',
                        backgroundSize: '12px 12px',
                        color: visual.cardInk,
                      }}
                    />

                    <div className="relative z-10 flex h-full max-w-[58%] flex-col">
                      <div>
                        <div className="text-[2.25rem] font-black leading-none tracking-[-0.08em] opacity-35" style={{ color: visual.cardInk }}>
                          {cardDate.day}
                        </div>
                        <div className="mt-1 text-sm font-bold opacity-45" style={{ color: visual.cardInk }}>
                          {cardDate.stamp}
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="max-w-[11rem] text-[2rem] font-black leading-[0.95] tracking-[-0.06em]" style={{ color: visual.cardInk }}>
                          {displayTitle}
                        </h2>
                        <p className="mt-2 text-base opacity-72" style={{ color: visual.cardInk }}>
                          {displayMeta}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-6">
                        {emojis.map((emoji) => (
                          <span
                            key={emoji}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/88 text-lg shadow-[0_8px_18px_rgba(17,18,23,0.08)]"
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ThemeArtwork
                      theme={theme}
                      visual={visual}
                      title={displayTitle}
                      statusLabel={statusLabel}
                    />

                    <div className="absolute bottom-5 right-5 rounded-full border border-black/8 bg-white/78 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#17181c] shadow-[0_10px_20px_rgba(17,18,23,0.08)]">
                      {isActive
                        ? themeCanSelect
                          ? t('sleepcastTapToGenerate')
                          : t('sleepcastOffline')
                        : getThemeName(t, theme)}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
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
  const visual = getSceneVisual(theme.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
      <ScreenFrame theme={theme}>
        <div
          className="my-auto rounded-[2.4rem] p-5"
          style={{ background: visual.card, boxShadow: `0 26px 50px ${visual.shadow}` }}
        >
          <div className="rounded-[1.8rem] bg-white/78 p-8 text-center shadow-[0_18px_34px_rgba(17,18,23,0.08)] backdrop-blur-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#17181c] text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
              <AlertCircle size={24} />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-black/34">{t('sleepcast')}</p>
            <h2 className="mt-2 text-[2rem] font-black leading-[0.96] tracking-[-0.05em] text-[#17181c]">
              {getThemeName(t, theme)}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-black/56">{message}</p>
            <button
              onClick={onStop}
              type="button"
              className="mt-6 inline-flex items-center rounded-full bg-[#17181c] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)] transition-transform active:scale-95"
            >
              {t('sleepcastTryAgain')}
            </button>
          </div>
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
