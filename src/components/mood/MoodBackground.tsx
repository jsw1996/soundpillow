import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { MoodConfig } from '../../data/moodMessages';

interface MoodBackgroundProps {
  config?: MoodConfig;
  imageLoaded: boolean;
  hideGradient?: boolean;
  children: ReactNode;
}

export function MoodBackground({ config, imageLoaded, hideGradient, children }: MoodBackgroundProps) {
  const from = config?.gradientFrom ?? '#4F46E5';
  const to = config?.gradientTo ?? '#7C3AED';

  return (
    <div className="absolute inset-0 overflow-hidden">
      {!hideGradient && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
        />
      )}

      {config && (
        <motion.img
          key={config.imageUrl}
          src={config.imageUrl}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      )}

      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
