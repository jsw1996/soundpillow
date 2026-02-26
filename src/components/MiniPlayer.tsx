import { Play, Pause, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';
import { useAppContext } from '../context/AppContext';

interface MiniPlayerProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
}

export function MiniPlayer({ track, isPlaying, progress, onTogglePlay }: MiniPlayerProps) {
  const { currentScreen, setCurrentScreen } = useAppContext();

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
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-3 pb-3 z-40"
        >
          <div
            onClick={() => setCurrentScreen('player')}
            className="glass-panel rounded-2xl p-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            {/* Progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl overflow-hidden">
              <div
                className="h-full bg-primary/60 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Artwork */}
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                <img
                  src={track.imageUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{track.title}</p>
                <p className="text-[10px] text-white/40 font-medium truncate">{track.artist}</p>
              </div>

              {/* Controls */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="p-2 rounded-full bg-primary/20 text-primary active:scale-90 transition-transform"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>

              <ChevronUp size={16} className="text-white/30" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
