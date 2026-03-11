import { Play, Pause, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';
import { useAppContext } from '../context/AppContext';
import { useTranslation, useTrackTranslation } from '../i18n';

interface MiniPlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  mixName?: string | null;
  onTap?: () => void;
}

export function MiniPlayer({ track, isPlaying, onTogglePlay, mixName, onTap }: MiniPlayerProps) {
  const { currentScreen, setCurrentScreen } = useAppContext();
  const { t } = useTranslation();
  const tt = useTrackTranslation();
  const translatedTrack = tt(track);

  const show = currentScreen !== 'player';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mini-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          className="fixed left-0 right-0 max-w-md mx-auto px-4 z-40"
          style={{ bottom: 'calc(4rem + 0.5rem + env(safe-area-inset-bottom) * 0.4)' }}
        >
          <div
            onClick={() => onTap ? onTap() : setCurrentScreen('player')}
            className="relative glass-dock glass-noise rounded-full px-3.5 py-1.5 cursor-pointer active:scale-[0.97] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              {/* Artwork with glow */}
              <div className="relative w-9 h-9 shrink-0">
                <div
                  className="absolute inset-0 rounded-xl blur-md opacity-40"
                  style={{ backgroundImage: `url(${track.imageUrl})`, backgroundSize: 'cover' }}
                />
                <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10">
                  <img
                    src={track.imageUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate">{mixName || translatedTrack.title}</p>
                <p className="text-[10px] text-foreground/35 font-medium truncate">{mixName ? t('mixPlaying') : translatedTrack.artist}</p>
              </div>

              {/* Controls */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="p-2.5 rounded-full liquid-glass-sm text-primary active:scale-90 transition-transform"
              >
                {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
              </button>

              <ChevronUp size={14} className="text-foreground/25" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
