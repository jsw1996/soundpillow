import { useState, useCallback } from 'react';
import {
  ChevronDown,
  SkipBack,
  SkipForward,
  Timer,
  Heart,
  Sliders,
  Moon,
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
  mixSubtitle?: string | null;
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
  mixSubtitle,
  onOpenMixer,
}: PlayerScreenProps) {
  const { isFavorite, toggleFavorite } = useAppContext();
  const { t } = useTranslation();
  const tt = useTrackTranslation();
  const translatedTrack = tt(track);
  const [showTimer, setShowTimer] = useState(false);

  const handleTimerToggle = useCallback(() => {
    setShowTimer(prev => !prev);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 flex flex-col overflow-hidden"
    >
      {/* ── Full-screen artwork background ── */}
      <div className="absolute inset-0">
        <motion.img
          src={track.imageUrl}
          alt={track.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: isPlaying ? 1.05 : 1 }}
          transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        />
        {/* Cinematic overlays for depth */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />

        {/* ── Ambient particles ── */}
        <AmbientParticles count={4} minSize={3} maxSize={6} />
      </div>

      {/* ── Header ── */}
      <header
        className="relative flex items-center justify-between px-5 z-20"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onBack}
          className="p-2.5 rounded-full liquid-glass-sm active:scale-90 transition-transform"
        >
          <ChevronDown size={22} className="text-white/80" />
        </button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] uppercase tracking-[0.3em] font-semibold text-white/40"
        >
          {mixName ? t('playingMix') : t('nowPlaying')}
        </motion.p>

        <div className="flex items-center gap-1">
          {mixName && onOpenMixer && (
            <button
              onClick={onOpenMixer}
              className="p-2.5 rounded-full liquid-glass-sm active:scale-90 transition-transform"
            >
              <Sliders size={18} className="text-white/80" />
            </button>
          )}
          <button
            onClick={() => toggleFavorite(track.id)}
            className="p-2.5 rounded-full liquid-glass-sm active:scale-90 transition-transform"
          >
            <Heart
              size={20}
              className={`transition-colors duration-300 ${isFavorite(track.id) ? 'text-primary' : 'text-white/70'}`}
              fill={isFavorite(track.id) ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </header>

      {/* ── Spacer — lets the image breathe ── */}
      <div className="flex-1 min-h-0" />

      {/* ── Bottom controls ── */}
      <div className="relative z-10 px-7 space-y-5" style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}>

        {/* Track info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-1"
        >
          <h1 className="text-[28px] font-extrabold tracking-tight leading-tight text-white drop-shadow-lg">
            {mixName ?? translatedTrack.title}
          </h1>
          <p className="text-[15px] text-white/60 font-medium">
            {mixName ? (mixSubtitle ?? translatedTrack.title) : translatedTrack.artist}
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="progress-container relative h-[3px] w-full bg-white/15 rounded-full overflow-visible group">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute top-0 left-0 h-full bg-white rounded-full"
            />
            <div className="progress-thumb" style={{ left: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-white/35 tabular-nums">
            <span>{currentTime}</span>
            <span>{duration}</span>
          </div>
        </motion.div>

        {/* Playback controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center justify-between"
        >
          {/* Timer toggle */}
          <button
            onClick={handleTimerToggle}
            className={`p-3 rounded-full liquid-glass-sm transition-all duration-300 active:scale-90 ${
              timerMinutes !== null
                ? 'text-primary'
                : showTimer ? 'text-white/90' : 'text-white/60'
            }`}
          >
            <Moon size={18} />
          </button>

          <div className="flex items-center gap-10">
            <button
              onClick={onSkipPrev}
              className="p-3 rounded-full liquid-glass-sm text-white/70 active:scale-90 transition-all"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            <PlayPauseButton isPlaying={isPlaying} onToggle={onTogglePlay} />

            <button
              onClick={onSkipNext}
              className="p-3 rounded-full liquid-glass-sm text-white/70 active:scale-90 transition-all"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>

          {/* Timer countdown display */}
          <div className="w-[44px] text-center">
            {timerMinutes !== null && (
              <span className="text-[10px] font-semibold text-primary tabular-nums">
                {formatTimerDisplay(timerSecondsRemaining)}
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Sleep timer drawer ── */}
        <AnimatePresence>
          {showTimer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 pb-1">
                <Timer size={12} className="text-white/30" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/30">
                  {t('sleepTimer')}
                </span>
              </div>
              <div className="flex justify-center gap-2.5">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => onSetTimer(timerMinutes === mins ? null : mins)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 active:scale-95 ${
                      timerMinutes === mins
                        ? 'liquid-glass-pill-active text-white'
                        : 'liquid-glass-pill text-white/50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
