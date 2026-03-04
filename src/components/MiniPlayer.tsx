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
}

export function MiniPlayer({ track, isPlaying, onTogglePlay, mixName }: MiniPlayerProps) {
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
          className="fixed left-0 right-0 max-w-md mx-auto px-3 pb-2 z-40"
          style={{ bottom: 'calc(3.2rem + 0.75rem + env(safe-area-inset-bottom) * 0.4)' }}
        >
          <div
            onClick={() => setCurrentScreen('player')}
            className="glass-panel px-3 py-2 cursor-pointer active:scale-[0.98] transition-transform" style={{ borderRadius: '45px' }}
          >
            <div className="flex items-center gap-3">
              {/* Artwork */}
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <img
                  src={track.imageUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{mixName || translatedTrack.title}</p>
                <p className="text-[10px] text-foreground/40 font-medium truncate">{mixName ? t('mixPlaying') : translatedTrack.artist}</p>
              </div>

              {/* Controls */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="p-2 rounded-full liquid-glass-sm text-white/80 active:scale-90 transition-transform"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>

              <ChevronUp size={16} className="text-foreground/30" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
