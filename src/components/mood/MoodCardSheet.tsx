import { motion } from 'motion/react';
import { Share2, Check } from 'lucide-react';
import type { MoodConfig } from '../../data/moodMessages';
import type { MoodEntry } from '../../types';
import { useTranslation } from '../../i18n';
import { formatDateLabel } from '../../utils/date';

interface MoodCardSheetProps {
  entry: MoodEntry;
  config: MoodConfig;
  sharing: boolean;
  onShare: () => void;
  onDone: () => void;
}

export function MoodCardSheet({ entry, config, sharing, onShare, onDone }: MoodCardSheetProps) {
  const { t } = useTranslation();
  const dateLabel = formatDateLabel();

  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0, y: 40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.88, opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="flex flex-col items-center w-full px-6"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      {/* Polaroid card */}
      <div
        className="w-full bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18)' }}
      >
        {/* Photo area */}
        <div className="relative w-full aspect-square">
          <img
            src={config.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-x-0 bottom-0 h-20"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.40), transparent)' }}
          />
          {/* Date */}
          <p className="absolute bottom-3 left-0 right-0 text-center text-white/75 text-xs font-semibold tracking-wide">
            {dateLabel}
          </p>
        </div>

        {/* White strip */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0.4, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.05 }}
            className="text-5xl select-none"
            style={{ lineHeight: 1 }}
          >
            {config.emoji}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center text-[14px] leading-relaxed font-semibold text-gray-800 px-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            "{entry.message}"
          </motion.p>

          <p className="text-[11px] text-gray-300 font-medium mt-0.5 tracking-wide">
            半刻 ✦ mood card
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex gap-3 w-full mt-4"
      >
        <button
          onClick={onShare}
          disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/20 border border-white/25 text-white font-bold text-sm active:scale-95 hover:bg-white/28 transition-all disabled:opacity-50"
        >
          {sharing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
            />
          ) : (
            <Share2 size={15} />
          )}
          {t('moodShare')}
        </button>
        <button
          onClick={onDone}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/90 text-gray-800 font-bold text-sm active:scale-95 hover:bg-white transition-all"
        >
          <Check size={15} />
          {t('moodDone')}
        </button>
      </motion.div>
    </motion.div>
  );
}
