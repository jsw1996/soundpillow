import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { MOODS } from '../../data/moodMessages';
import type { MoodLevel } from '../../types';
import { useTranslation } from '../../i18n';

interface MoodSelectSheetProps {
  hovered: MoodLevel | null;
  onHover: (mood: MoodLevel | null) => void;
  onSelect: (mood: MoodLevel) => void;
  onDismiss: () => void;
}

export function MoodSelectSheet({ hovered, onHover, onSelect, onDismiss }: MoodSelectSheetProps) {
  const { t } = useTranslation();
  const hoverConfig = MOODS.find((m) => m.level === hovered);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="w-full rounded-t-4xl bg-white/10 backdrop-blur-2xl border-t border-white/15 px-6 pt-5"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      {/* Handle */}
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white">{t('moodCheckInTitle')}</h2>
          <p className="text-sm text-white/55 mt-0.5">{t('moodCheckInSubtitle')}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 rounded-full bg-white/10 text-white/50 hover:bg-white/18 active:scale-90 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Gradient preview bar */}
      <motion.div
        className="h-1.5 rounded-full mb-6 transition-all duration-500"
        style={{
          background: hoverConfig
            ? `linear-gradient(to right, ${hoverConfig.gradientFrom}, ${hoverConfig.gradientTo})`
            : 'linear-gradient(to right, #4F46E5, #EC4899)',
          opacity: hoverConfig ? 1 : 0.3,
        }}
      />

      {/* Mood buttons */}
      <div className="flex justify-between gap-2">
        {MOODS.map((mood) => (
          <motion.button
            key={mood.level}
            onHoverStart={() => onHover(mood.level)}
            onHoverEnd={() => onHover(null)}
            whileTap={{ scale: 0.88 }}
            onClick={() => onSelect(mood.level)}
            className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-colors"
            style={{
              background:
                hovered === mood.level
                  ? `linear-gradient(135deg, ${mood.gradientFrom}33, ${mood.gradientTo}33)`
                  : 'transparent',
            }}
          >
            <motion.span
              className="text-3xl select-none"
              animate={{ scale: hovered === mood.level ? 1.25 : 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 300 }}
              style={{ lineHeight: 1 }}
            >
              {mood.emoji}
            </motion.span>
            <span className="text-[10px] font-semibold text-white/60 capitalize">
              {t(`mood_${mood.level}` as any)}
            </span>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/35 mt-5">{t('moodCheckInFooter')}</p>
    </motion.div>
  );
}
