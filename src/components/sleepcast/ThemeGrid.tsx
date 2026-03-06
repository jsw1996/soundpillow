import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { SLEEPCAST_THEMES } from '../../data/sleepcastThemes';
import { useTranslation } from '../../i18n';
import type { GeneratedSleepcast, SleepcastTheme } from '../../types';
import { screenTransition } from '../../utils/animations';
import { HeaderBadge, ScreenFrame, ThemeArtwork } from './SleepcastShared';
import { type ThemeFilter } from './types';
import {
  formatCardDate,
  getFilterLabel,
  getSceneVisual,
  getThemeName,
  THEME_EMOJIS,
} from './utils';

export function ThemeGrid({
  onSelect,
  isConfigured,
  dailyStories,
  storiesLoading,
  onRetry,
}: {
  onSelect: (theme: SleepcastTheme) => void;
  isConfigured: boolean;
  dailyStories: GeneratedSleepcast[];
  storiesLoading: boolean;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ThemeFilter>('all');
  const [activeThemeId, setActiveThemeId] = useState(SLEEPCAST_THEMES[0]?.id ?? '');

  const storiesByTheme = useMemo(
    () => new Map(dailyStories.map((story) => [story.themeId, story])),
    [dailyStories],
  );

  const filteredThemes = useMemo(() => {
    switch (filter) {
      case 'ready':
        return SLEEPCAST_THEMES.filter((theme) => storiesByTheme.has(theme.id));
      case 'generate':
        return SLEEPCAST_THEMES.filter((theme) => !storiesByTheme.has(theme.id));
      case 'offline':
        return isConfigured ? [] : SLEEPCAST_THEMES;
      default:
        return SLEEPCAST_THEMES;
    }
  }, [filter, isConfigured, storiesByTheme]);

  useEffect(() => {
    if (!filteredThemes.some((theme) => theme.id === activeThemeId) && filteredThemes[0]) {
      setActiveThemeId(filteredThemes[0].id);
    }
  }, [activeThemeId, filteredThemes]);

  const activeTheme = filteredThemes.find((theme) => theme.id === activeThemeId)
    ?? SLEEPCAST_THEMES.find((theme) => theme.id === activeThemeId)
    ?? filteredThemes[0]
    ?? SLEEPCAST_THEMES[0];

  const storiesReady = dailyStories.length > 0;
  const filters: ThemeFilter[] = isConfigured
    ? ['all', 'ready', 'generate']
    : ['all', 'offline', 'generate'];

  return (
    <motion.div {...screenTransition} className="absolute inset-0 flex flex-col">
      <ScreenFrame theme={activeTheme} bottomPadding="calc(6rem + env(safe-area-inset-bottom))">
        {/* <div className="flex items-center justify-between gap-4">
          <HeaderBadge imageUrl={activeTheme.imageUrl} />
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-black/8 bg-white/65 text-[#17181c] shadow-[0_10px_24px_rgba(23,24,28,0.08)] backdrop-blur-md transition-transform active:scale-95"
            aria-label={t('sleepcast')}
          >
            <Plus size={24} />
          </button>
        </div> */}

        <div className="mt-8 max-w-[16rem]">
          <p className="text-sm font-medium text-black/45">{t('sleepcastCollectionLabel')}</p>
          <h1 className="mt-3 text-[2.25rem] font-black italic leading-[0.9] tracking-[-0.08em] text-[#111217]">
            {t('sleepcastTraceTitle')}
            <span className="ml-2 align-top text-[2rem] not-italic">✨</span>
          </h1>
        </div>

        <div className="mt-7 -mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3 px-1">
            {filters.map((item) => {
              const isActive = filter === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full border px-5 py-3 text-base font-semibold transition-all ${
                    isActive
                      ? 'border-black bg-[#111217] text-white'
                      : 'border-black/8 bg-white/55 text-black/72'
                  }`}
                >
                  {getFilterLabel(t, item)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
          <div className="rounded-full border border-black/7 bg-white/55 px-3 py-2">
            {t('sleepcastStoriesReady', { count: dailyStories.length })}
          </div>
          {storiesLoading && (
            <div className="flex items-center gap-2 rounded-full border border-black/7 bg-white/55 px-3 py-2 shadow-[0_8px_18px_rgba(17,18,23,0.05)]">
              <Loader2 size={12} className="animate-spin" />
              <span>{t('sleepcastGenerating')}</span>
            </div>
          )}
          {!isConfigured && (
            <div className="flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/90 px-3 py-2 text-amber-900 shadow-[0_8px_18px_rgba(245,158,11,0.10)]">
              <WifiOff size={12} />
              <span>{t('sleepcastOffline')}</span>
            </div>
          )}
          {!isConfigured && onRetry && (
            <button
              onClick={onRetry}
              disabled={storiesLoading}
              type="button"
              className="flex items-center gap-2 rounded-full border border-black/7 bg-white/55 px-3 py-2 shadow-[0_8px_18px_rgba(17,18,23,0.05)] transition-transform active:scale-95 disabled:opacity-45"
            >
              <RefreshCw size={12} className={storiesLoading ? 'animate-spin' : ''} />
              <span>{t('sleepcastTryAgain')}</span>
            </button>
          )}
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-hidden">
          {filteredThemes.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[2rem] border border-dashed border-black/10 bg-white/45 p-6 text-center text-black/48">
              {t('sleepcastNoResults')}
            </div>
          ) : (
            <div className="no-scrollbar flex h-full flex-col gap-4 overflow-y-auto pb-1">
              {filteredThemes.map((theme, index) => {
                const visual = getSceneVisual(theme.id);
                const story = storiesByTheme.get(theme.id);
                const isActive = theme.id === activeThemeId;
                const themeCanSelect = isConfigured && (!!story || !storiesReady);
                const cardDate = formatCardDate(story?.createdAt ?? Date.now() - index * 86400000);
                const displayTitle = story?.title ?? getThemeName(t, theme);
                const displayMeta = story
                  ? `${story.paragraphs.length} ${t('sleepcastParagraphs')}`
                  : t('sleepcastTapToGenerate');
                const statusLabel = story
                  ? t('sleepcastAvailableNow')
                  : themeCanSelect
                  ? t('sleepcastGenerateNow')
                  : t('sleepcastOffline');
                const emojis = THEME_EMOJIS[theme.id] ?? ['✨', '🌙', '🎧'];

                return (
                  <motion.button
                    key={theme.id}
                    type="button"
                    whileTap={{ scale: 0.988 }}
                    onClick={() => {
                      if (!isActive) {
                        setActiveThemeId(theme.id);
                        return;
                      }

                      if (themeCanSelect) {
                        onSelect(theme);
                      }
                    }}
                    className={`relative overflow-hidden rounded-[2.4rem] px-5 py-5 text-left transition-all ${isActive ? 'scale-[1.01]' : ''} ${themeCanSelect || !isActive ? '' : 'cursor-not-allowed'}`}
                    style={{
                      background: visual.card,
                      minHeight: 248,
                      boxShadow: isActive
                        ? `0 26px 50px ${visual.shadow}`
                        : '0 18px 34px rgba(23,24,28,0.10)',
                      transform: isActive
                        ? 'rotate(-1deg)'
                        : index % 3 === 0
                        ? 'rotate(-0.8deg)'
                        : index % 3 === 1
                        ? 'rotate(0.9deg)'
                        : 'rotate(-0.35deg)',
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage: 'radial-gradient(currentColor 0.8px, transparent 0.8px)',
                        backgroundSize: '12px 12px',
                        color: visual.cardInk,
                      }}
                    />

                    <div className="relative z-10 flex h-full max-w-[58%] flex-col">
                      <div>
                        <div className="text-[2.25rem] font-black leading-none tracking-[-0.08em] opacity-35" style={{ color: visual.cardInk }}>
                          {cardDate.day}
                        </div>
                        <div className="mt-1 text-sm font-bold opacity-45" style={{ color: visual.cardInk }}>
                          {cardDate.stamp}
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="max-w-[11rem] text-[2rem] font-black leading-[0.95] tracking-[-0.06em]" style={{ color: visual.cardInk }}>
                          {displayTitle}
                        </h2>
                        <p className="mt-2 text-base opacity-72" style={{ color: visual.cardInk }}>
                          {displayMeta}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-6">
                        {emojis.map((emoji) => (
                          <span
                            key={emoji}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/88 text-lg shadow-[0_8px_18px_rgba(17,18,23,0.08)]"
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ThemeArtwork
                      theme={theme}
                      visual={visual}
                      title={displayTitle}
                      statusLabel={statusLabel}
                    />

                    <div className="absolute bottom-5 right-5 rounded-full border border-black/8 bg-white/78 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#17181c] shadow-[0_10px_20px_rgba(17,18,23,0.08)]">
                      {isActive
                        ? themeCanSelect
                          ? t('sleepcastTapToGenerate')
                          : t('sleepcastOffline')
                        : getThemeName(t, theme)}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </ScreenFrame>
    </motion.div>
  );
}
