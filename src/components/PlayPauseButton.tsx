import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  iconSize?: number;
}

export function PlayPauseButton({ isPlaying, onToggle, iconSize = 28 }: PlayPauseButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="relative size-[68px] rounded-full flex items-center justify-center active:scale-90 transition-transform"
    >
      <div className="absolute inset-[-6px] bg-white/10 rounded-full blur-xl" />
      <div className="relative size-full liquid-glass-play rounded-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Pause size={iconSize} fill="white" className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Play size={iconSize} fill="white" className="text-white ml-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
