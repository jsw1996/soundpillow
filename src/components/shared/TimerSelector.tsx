import { Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../../i18n';

const TIMER_OPTIONS = [15, 30, 45, 60] as const;

interface TimerSelectorProps {
  show: boolean;
  timerMinutes: number | null;
  onSetTimer: (mins: number | null) => void;
}

export function TimerSelector({ show, timerMinutes, onSetTimer }: TimerSelectorProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {show && (
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
            {TIMER_OPTIONS.map((mins) => (
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
  );
}
