import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { SleepcastTheme } from '../../types';
import { useTranslation } from '../../i18n';
import { useAppContext } from '../../context/AppContext';
import { ScreenFrame } from './SleepcastShared';
import { getSceneVisual, getThemeName } from './utils';

export function ErrorView({
  theme,
  message,
  onStop,
}: {
  theme: SleepcastTheme;
  message: string;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  const { settings } = useAppContext();
  const isDark = settings.theme === 'dark';
  const visual = getSceneVisual(theme.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
      <ScreenFrame theme={theme}>
        <div
          className="my-auto rounded-[2.4rem] p-5"
          style={{ background: visual.card, boxShadow: `0 26px 50px ${visual.shadow}` }}
        >
          <div className={`rounded-[1.8rem] p-8 text-center shadow-[0_18px_34px_rgba(17,18,23,0.08)] backdrop-blur-md ${isDark ? 'bg-white/8' : 'bg-white/78'}`}>
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-[0_18px_34px_rgba(15,23,42,0.18)] ${isDark ? 'bg-white/12 text-white' : 'bg-[#17181c] text-white'}`}>
              <AlertCircle size={24} />
            </div>
            <p className={`mt-5 text-[11px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-white/38' : 'text-black/34'}`}>{t('sleepcast')}</p>
            <h2 className={`mt-2 text-[2rem] font-black leading-[0.96] tracking-[-0.05em] ${isDark ? 'text-white' : 'text-[#17181c]'}`}>
              {getThemeName(t, theme)}
            </h2>
            <p className={`mt-4 text-sm leading-relaxed ${isDark ? 'text-white/68' : 'text-black/56'}`}>{message}</p>
            <button
              onClick={onStop}
              type="button"
              className={`mt-6 inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)] transition-transform active:scale-95 ${isDark ? 'bg-white/14' : 'bg-[#17181c]'}`}
            >
              {t('sleepcastTryAgain')}
            </button>
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}
