import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { SleepcastTheme } from '../../types';
import { useTranslation } from '../../i18n';
import { ScreenFrame, HeaderBadge, ThemeArtwork } from './SleepcastShared';
import { getSceneVisual, getThemeName } from './utils';

export function LoadingView({ theme }: { theme: SleepcastTheme }) {
  const { t } = useTranslation();
  const visual = getSceneVisual(theme.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col">
      <ScreenFrame theme={theme}>
        <div className="flex items-center justify-between">
          <HeaderBadge imageUrl={theme.imageUrl} />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-white/65 shadow-[0_10px_24px_rgba(23,24,28,0.08)] backdrop-blur-md">
            <Sparkles size={22} style={{ color: visual.accent }} />
          </div>
        </div>

        <div className="mt-8 max-w-[16rem]">
          <p className="text-sm font-medium text-black/45">{t('sleepcastGreetingSubline')}</p>
          <h1 className="mt-3 text-[3.1rem] font-black italic leading-[0.9] tracking-[-0.08em] text-[#111217]">
            {t('sleepcastTraceTitle')}
          </h1>
        </div>

        <div
          className="mt-8 rounded-[2.25rem] p-5"
          style={{ background: visual.card, boxShadow: `0 24px 50px ${visual.shadow}` }}
        >
          <div className="relative min-h-[17.5rem] overflow-hidden rounded-[1.7rem] bg-black/6 px-5 py-5">
            <div className="relative z-10 max-w-[12rem]">
              <div className="text-[11px] font-black uppercase tracking-[0.02em] opacity-55" style={{ color: visual.cardInk }}>
                {t('sleepcastGenerating')}
              </div>
              <h2 className="mt-4 text-[2.3rem] font-black leading-[0.92] tracking-[-0.06em]" style={{ color: visual.cardInk }}>
                {getThemeName(t, theme)}
              </h2>
              <p className="mt-3 text-sm leading-6 opacity-75" style={{ color: visual.cardInk }}>
                {t('sleepcastGeneratingDesc')}
              </p>
            </div>

            <ThemeArtwork
              theme={theme}
              visual={visual}
              title={getThemeName(t, theme)}
              statusLabel={t('sleepcastGenerating')}
            />

            <div className="relative z-10 mt-8 flex items-end gap-2">
              {[0, 1, 2, 3].map((index) => (
                <motion.span
                  key={index}
                  className="w-2.5 rounded-full"
                  animate={{ height: [8, 30, 10], opacity: [0.32, 1, 0.42] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12 }}
                  style={{ background: visual.cardInk }}
                />
              ))}
              <Loader2 size={18} className="ml-3 animate-spin" style={{ color: visual.cardInk }} />
            </div>
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}
