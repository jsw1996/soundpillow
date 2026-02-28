import { useMemo } from 'react';
import {
  CloudRain, Trees, Star, Snowflake, Flower2, Ship,
  Play, Pause, Square, Loader2, BookOpen, AlertCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SLEEPCAST_THEMES } from '../data/sleepcastThemes';
import type { SleepcastTheme, SleepcastStatus, GeneratedSleepcast } from '../types';
import { useTranslation } from '../i18n';

const THEME_ICONS: Record<string, React.ReactNode> = {
  CloudRain: <CloudRain size={28} />,
  Trees: <Trees size={28} />,
  Star: <Star size={28} />,
  Snowflake: <Snowflake size={28} />,
  Flower2: <Flower2 size={28} />,
  Ship: <Ship size={28} />,
};

interface SleepcastScreenProps {
  status: SleepcastStatus;
  currentCast: GeneratedSleepcast | null;
  currentTheme: SleepcastTheme | null;
  activeParagraph: number;
  error: string | null;
  isConfigured: boolean;
  streamingText: string;
  onStartSleepcast: (theme: SleepcastTheme) => void;
  onTogglePlay: () => void;
  onStop: () => void;
}

function AmbientParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: `${15 + Math.random() * 70}%`,
        size: 3 + Math.random() * 5,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="ambient-particle"
          style={{
            left: p.left, bottom: '-10px',
            width: p.size, height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Streaming view shown while AI generates the story — displays text as it arrives */
function GeneratingView({ theme, streamingText }: { theme: SleepcastTheme; streamingText: string }) {
  const { t } = useTranslation();
  const hasText = streamingText.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Header with theme image */}
      <div className="relative shrink-0" style={{ height: hasText ? '22%' : '30%' }}>
        <img
          src={theme.imageUrl}
          alt={theme.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-dark via-bg-dark/80 to-transparent" />
        <AmbientParticles />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 size={14} className="text-primary animate-spin" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">
              {t('sleepcastGenerating')}
            </p>
          </div>
          <p className="text-xs text-white/40">{t('sleepcastGeneratingDesc')}</p>
        </div>
      </div>

      {/* Streaming text */}
      {hasText ? (
        <div className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar">
          <div className="py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap"
            >
              {streamingText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-primary/60 ml-0.5 align-text-bottom"
              />
            </motion.div>
          </div>
        </div>
      ) : (
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
      )}
    </motion.div>
  );
}

/** Active narration playback view */
function PlaybackView({
  cast,
  theme,
  activeParagraph,
  status,
  isStreaming,
  onTogglePlay,
  onStop,
}: {
  cast: GeneratedSleepcast;
  theme: SleepcastTheme;
  activeParagraph: number;
  status: SleepcastStatus;
  isStreaming: boolean;
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
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-dark via-bg-dark/80 to-transparent" />
        <AmbientParticles />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">
              {t('sleepcast')}
            </p>
            {isStreaming && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/15">
                <Loader2 size={10} className="text-primary animate-spin" />
                <span className="text-[9px] font-bold text-primary/70">{t('sleepcastGenerating')}</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-extrabold leading-tight">{cast.title}</h1>
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
                  ? 'text-white font-medium'
                  : i < activeParagraph
                  ? 'text-white/50'
                  : 'text-white/25'
              }`}
            >
              {para}
            </motion.p>
          ))}
          {isStreaming && (
            <div className="flex items-center gap-1 pt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Playback controls */}
      <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {/* Progress */}
        <div className="mb-4 space-y-1.5">
          <div className="h-1 w-full bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary/70 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 font-bold">
            <span>{activeParagraph + 1} / {cast.paragraphs.length}</span>
            <span>{t('sleepcastParagraphs')}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onStop}
            className="p-3 rounded-full bg-white/5 text-white/40 active:scale-90 transition-all hover:bg-white/10"
          >
            <Square size={20} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="relative size-16 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl" />
            <div className="relative size-full bg-linear-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(155,126,216,0.5)]">
              <AnimatePresence mode="wait">
                {status === 'playing' ? (
                  <motion.div key="pause" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Pause size={28} fill="white" className="text-white" />
                  </motion.div>
                ) : (
                  <motion.div key="play" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Play size={28} fill="white" className="text-white ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
          <div className="w-11" /> {/* spacer for centering */}
        </div>
      </div>
    </motion.div>
  );
}

/** Theme selection grid (idle state) */
function ThemeGrid({
  onSelect,
  isConfigured,
}: {
  onSelect: (theme: SleepcastTheme) => void;
  isConfigured: boolean;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 overflow-y-auto pb-40 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
    >
      {/* Header */}
      <div className="px-6 mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <h1 className="text-xl font-extrabold">{t('sleepcastTitle')}</h1>
        </div>
        <p className="text-sm text-white/40">{t('sleepcastSubtitle')}</p>
      </div>

      {/* API key warning */}
      {!isConfigured && (
        <div className="mx-6 mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">{t('sleepcastNoApiKey')}</p>
            <p className="text-xs text-amber-300/60 mt-1">{t('sleepcastNoApiKeyDesc')}</p>
          </div>
        </div>
      )}

      {/* AI badge */}
      <div className="px-6 mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('sleepcastAiPowered')}</span>
        </div>
      </div>

      {/* Theme cards */}
      <div className="px-6 grid grid-cols-2 gap-3">
        {SLEEPCAST_THEMES.map((theme, i) => (
          <motion.button
            key={theme.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => isConfigured && onSelect(theme)}
            disabled={!isConfigured}
            className={`relative rounded-2xl overflow-hidden text-left group ${
              !isConfigured ? 'opacity-50' : 'active:scale-[0.96]'
            } transition-transform`}
          >
            <div className="aspect-[4/3]">
              <img
                src={theme.imageUrl}
                alt={theme.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                  {THEME_ICONS[theme.icon] ? (
                    <div className="[&>svg]:w-3.5 [&>svg]:h-3.5">{THEME_ICONS[theme.icon]}</div>
                  ) : (
                    <BookOpen size={14} />
                  )}
                </div>
              </div>
              <p className="text-sm font-bold leading-tight">{t(`sleepcastTheme_${theme.id}` as any) || theme.name}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{t('sleepcastTapToGenerate')}</p>
            </div>
          </motion.button>
        ))}
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
  streamingText,
  onStartSleepcast,
  onTogglePlay,
  onStop,
}: SleepcastScreenProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence mode="popLayout">
      {status === 'generating' && currentTheme && !currentCast && (
        <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col">
          <GeneratingView theme={currentTheme} streamingText={streamingText} />
        </motion.div>
      )}

      {(status === 'playing' || status === 'paused' || (status === 'generating' && currentCast)) && currentCast && currentTheme && (
        <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <PlaybackView
            isStreaming={streamingText.length > 0}
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
          <p className="text-sm text-center text-white/60">{error || t('sleepcastError')}</p>
          <button
            onClick={onStop}
            className="px-6 py-2.5 rounded-2xl bg-white/5 text-white/60 text-sm font-semibold"
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
        />
      )}
    </AnimatePresence>
  );
}
