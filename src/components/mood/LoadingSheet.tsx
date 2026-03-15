import { motion } from 'motion/react';
import { MOODS } from '../../data/moodMessages';
import type { MoodLevel } from '../../types';
import { useTranslation } from '../../i18n';

interface LoadingSheetProps {
  mood: MoodLevel;
}

export function LoadingSheet({ mood }: LoadingSheetProps) {
  const { t } = useTranslation();
  const config = MOODS.find((m) => m.level === mood)!;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="app-bottom-sheet w-full rounded-t-4xl bg-white/10 backdrop-blur-2xl border-t border-white/15 px-6 pt-5"
      style={{ paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}
    >
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-8" />

      <div className="flex flex-col items-center gap-4 py-4">
        {/* Bouncing emoji */}
        <motion.div
          className="text-6xl select-none"
          animate={{ y: [0, -14, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ lineHeight: 1 }}
        >
          {config.emoji}
        </motion.div>

        {/* Animated gradient bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/15">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`,
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <p className="text-sm font-semibold text-white/60">{t('moodGenerating')}</p>
      </div>
    </motion.div>
  );
}
