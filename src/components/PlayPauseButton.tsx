import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  iconSize?: number;
  variant?: 'glass' | 'solid';
}

export function PlayPauseButton({
  isPlaying,
  onToggle,
  iconSize = 28,
  variant = 'glass',
}: PlayPauseButtonProps) {
  const isSolid = variant === 'solid';

  return (
    <button
      onClick={onToggle}
      className="relative size-[68px] rounded-full flex items-center justify-center active:scale-90 transition-transform"
    >
      {!isSolid && <div className="absolute inset-[-6px] bg-white/10 rounded-full blur-xl" />}
      <div
        className={`relative size-full rounded-full flex items-center justify-center ${
          isSolid
            ? 'border border-white/10 bg-white text-[#10131d] shadow-[0_14px_34px_rgba(0,0,0,0.28)]'
            : 'liquid-glass-play'
        }`}
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Pause
                size={iconSize}
                fill={isSolid ? 'currentColor' : 'white'}
                className={isSolid ? 'text-[#10131d]' : 'text-white'}
              />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Play
                size={iconSize}
                fill={isSolid ? 'currentColor' : 'white'}
                className={`${isSolid ? 'text-[#10131d]' : 'text-white'} ml-1`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
