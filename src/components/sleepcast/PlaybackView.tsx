import React, { useEffect, useRef } from 'react';
import { Square } from 'lucide-react';
import { motion } from 'motion/react';
import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../../types';
import { useTranslation } from '../../i18n';
import { PlayPauseButton } from '../PlayPauseButton';
import { HeaderBadge, ScreenFrame, ThemeArtwork } from './SleepcastShared';
import { getSceneVisual, getThemeName, getThemeSummary } from './utils';

export function PlaybackView({
  cast,
  theme,
  activeParagraph,
  status,
  onTogglePlay,
  onStop,
}: {
  cast: GeneratedSleepcast;
  theme: SleepcastTheme;
  activeParagraph: number;
  status: SleepcastStatus;
  onTogglePlay: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  const visual = getSceneVisual(theme.id);
  const progress = cast.paragraphs.length > 0
    ? ((activeParagraph + 1) / cast.paragraphs.length) * 100
    : 0;
  const paragraphRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const target = paragraphRefs.current[activeParagraph];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeParagraph]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-0 flex-1 flex-col">
      <ScreenFrame theme={theme}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HeaderBadge imageUrl={theme.imageUrl} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/38">
                {status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused')}
              </p>
              <p className="mt-1 text-sm text-black/50">{getThemeName(t, theme)}</p>
            </div>
          </div>

          <button
            onClick={onStop}
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-white/65 text-[#17181c] shadow-[0_10px_24px_rgba(23,24,28,0.08)] backdrop-blur-md transition-transform active:scale-95"
          >
            <Square size={18} fill="currentColor" />
          </button>
        </div>

        <div
          className="mt-7 rounded-[2.25rem] p-5"
          style={{ background: visual.card, boxShadow: `0 24px 50px ${visual.shadow}` }}
        >
          <div className="relative min-h-[13.5rem] overflow-hidden rounded-[1.7rem] px-5 py-5">
            <div className="relative z-10 max-w-[12rem]">
              <div className="text-[11px] font-black uppercase tracking-[0.02em] opacity-55" style={{ color: visual.cardInk }}>
                {String(activeParagraph + 1).padStart(2, '0')} / {String(cast.paragraphs.length).padStart(2, '0')}
              </div>
              <h1 className="mt-4 text-[2.15rem] font-black leading-[0.92] tracking-[-0.06em]" style={{ color: visual.cardInk }}>
                {cast.title}
              </h1>
              <p className="mt-3 text-sm leading-6 opacity-72" style={{ color: visual.cardInk }}>
                {getThemeSummary(theme)}
              </p>
            </div>

            <ThemeArtwork
              theme={theme}
              visual={visual}
              title={cast.title}
              statusLabel={status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused')}
            />
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] border border-black/6 bg-white/70 p-4 shadow-[0_18px_40px_rgba(23,24,28,0.06)] backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-black/38">
            <span>{getThemeName(t, theme)}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="mt-3 overflow-hidden rounded-full bg-black/8">
            <motion.div
              className="h-2 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45 }}
              style={{ background: `linear-gradient(90deg, ${visual.accent} 0%, rgba(255,255,255,0.96) 100%)` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-black/54">
              {cast.paragraphs.length} {t('sleepcastParagraphs')}
            </div>
            <PlayPauseButton
              isPlaying={status === 'playing'}
              onToggle={onTogglePlay}
              iconSize={28}
              variant="solid"
            />
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-hidden">
          <div className="no-scrollbar flex h-full flex-col gap-3 overflow-y-auto pb-1">
            {cast.paragraphs.map((paragraph, index) => {
              const isActive = index === activeParagraph;
              const isPast = index < activeParagraph;

              return (
                <motion.div
                  key={index}
                  ref={(node) => {
                    paragraphRefs.current[index] = node;
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: isActive ? 1 : isPast ? 0.76 : 0.58,
                    y: 0,
                    scale: isActive ? 1 : 0.985,
                  }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="rounded-[1.75rem] border px-4 py-4"
                  style={{
                    borderColor: isActive ? visual.rim : 'rgba(23,24,28,0.06)',
                    background: isActive ? '#17181c' : 'rgba(255,255,255,0.76)',
                    boxShadow: isActive
                      ? `0 18px 36px ${visual.shadow}`
                      : '0 14px 30px rgba(23,24,28,0.05)',
                    transform: isActive ? 'rotate(-1deg)' : isPast ? 'rotate(-0.4deg)' : 'rotate(0.35deg)',
                  }}
                >
                  <div className="flex gap-3">
                    <span
                      className="mt-0.5 shrink-0 text-[10px] font-black uppercase tracking-[0.24em]"
                      style={{ color: isActive ? '#ffffff' : 'rgba(23,24,28,0.34)' }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className={`text-[15px] leading-7 ${isActive ? 'font-medium text-white' : isPast ? 'text-black/64' : 'text-black/48'}`}>
                      {paragraph}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}
