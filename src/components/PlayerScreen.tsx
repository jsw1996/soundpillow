import {
  ChevronDown,
  SkipBack,
  SkipForward,
  Timer,
  Heart,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayPauseButton } from './PlayPauseButton';
import { Track } from '../types';
import { useAppContext } from '../context/AppContext';
import { useTranslation, useTrackTranslation } from '../i18n';
import { AmbientParticles } from './AmbientParticles';

interface PlayerScreenProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  timerMinutes: number | null;
  timerSecondsRemaining: number;
  onTogglePlay: () => void;
  onBack: () => void;
  onSetTimer: (mins: number | null) => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  formatTimerDisplay: (seconds: number) => string;
  mixName?: string | null;
  onOpenMixer?: () => void;
}

export function PlayerScreen({
  track,
  isPlaying,
  progress,
  currentTime,
  duration,
  timerMinutes,
  timerSecondsRemaining,
  onTogglePlay,
  onBack,
  onSetTimer,
  onSkipNext,
  onSkipPrev,
  formatTimerDisplay,
  mixName,
  onOpenMixer,
}: PlayerScreenProps) {
  const { isFavorite, toggleFavorite } = useAppContext();
  const { t } = useTranslation();
  const tt = useTrackTranslation();
  const translatedTrack = tt(track);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
      className="absolute inset-0 flex flex-col overflow-hidden"
    >
      {/* ── Full-width artwork hero ── */}
      <div className="relative w-full shrink-0" style={{ height: '45%' }}>
        <img
          src={track.imageUrl}
          alt={track.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg-dark via-bg-dark/80 to-transparent" />
        {/* Top gradient for header readability */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />

        {/* ── Ambient particles ── */}
        <AmbientParticles />
      </div>

      {/* ── Header (overlaid on artwork) ── */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pb-2 z-20" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <button
          onClick={onBack}
          className="p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
        >
          <ChevronDown size={22} className="text-white/80" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-primary/70">
            {mixName ? t('playingMix') : t('nowPlaying')}
          </p>
        </motion.div>

        <div className="flex items-center gap-2">
          {mixName && onOpenMixer && (
            <button
              onClick={onOpenMixer}
              className="p-2.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 active:scale-90 transition-transform"
            >
              <Sliders size={20} className="text-primary" />
            </button>
          )}
          <button
            onClick={() => toggleFavorite(track.id)}
            className="p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
          >
            <Heart
              size={22}
              className={`transition-colors ${isFavorite(track.id) ? 'text-primary' : 'text-white/80'}`}
              fill={isFavorite(track.id) ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 min-h-0 relative z-10 overflow-hidden -mt-6">
        {/* Track info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center space-y-1 max-w-xs"
        >
          <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
            {mixName ?? translatedTrack.title}
          </h1>
          <p className="text-sm text-primary/80 font-semibold">
            {mixName ? translatedTrack.title : translatedTrack.artist}
          </p>
          <p className="text-[11px] text-foreground/30 font-medium">
            {mixName ? t('mix') : track.category}
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-xs space-y-1.5"
        >
          <div
            className="progress-container relative h-1.5 w-full bg-foreground/8 rounded-full overflow-visible group"
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute top-0 left-0 h-full bg-linear-to-r from-primary/80 to-primary rounded-full"
            />
            {/* Glow on the progress tip */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary blur-sm pointer-events-none"
              style={{ left: `${progress}%` }}
            />
            {/* Thumb */}
            <div className="progress-thumb" style={{ left: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-foreground/30">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </motion.div>

        {/* Playback controls */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-8 w-full"
        >
          <button
            onClick={onSkipPrev}
            className="text-foreground/40 hover:text-foreground/80 active:scale-90 transition-all"
          >
            <SkipBack size={26} fill="currentColor" />
          </button>

          <PlayPauseButton isPlaying={isPlaying} onToggle={onTogglePlay} />

          <button
            onClick={onSkipNext}
            className="text-foreground/40 hover:text-foreground/80 active:scale-90 transition-all"
          >
            <SkipForward size={26} fill="currentColor" />
          </button>
        </motion.div>
      </div>

      {/* ── Timer panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="shrink-0 px-5 pb-6 pt-2 relative z-10"
      >
        <div className="bg-foreground/3 backdrop-blur-2xl border border-foreground/6 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-primary/60" />
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                {t('sleepTimer')}
              </span>
            </div>
            <AnimatePresence>
              {timerMinutes !== null && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[11px] font-bold text-primary tracking-wider tabular-nums"
                >
                  {formatTimerDisplay(timerSecondsRemaining)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => onSetTimer(timerMinutes === mins ? null : mins)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                  timerMinutes === mins
                    ? 'bg-primary text-white shadow-[0_0_16px_var(--glow-4)]'
                    : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/60'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
