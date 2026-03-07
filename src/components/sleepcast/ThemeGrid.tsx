import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { SLEEPCAST_THEMES } from '../../data/sleepcastThemes';
import { useTranslation } from '../../i18n';
import type { GeneratedSleepcast, SleepcastTheme } from '../../types';
import { screenTransition } from '../../utils/animations';
import { HeaderBadge, ScreenFrame } from './SleepcastShared';
import { type ThemeFilter } from './types';
import {
  formatCardDate,
  getFilterLabel,
  getSceneVisual,
  getThemeName,
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
                  : null;

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
                    className={`group relative overflow-hidden rounded-[2.4rem] px-5 py-5 text-left transition-all ${isActive ? 'scale-[1.01]' : ''} ${themeCanSelect || !isActive ? '' : 'cursor-not-allowed'}`}
                    style={{
                      minHeight: 248,
                      boxShadow: isActive
                        ? `0 26px 50px rgba(0,0,0,0.3)`
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
                    <div className="absolute inset-0">
                      <img
                        src={theme.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-active:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col justify-between text-white">
                      <div>
                        <div className="text-[2.25rem] font-black leading-none tracking-[-0.08em] text-white/90">
                          {cardDate.day}
                        </div>
                        <div className="mt-1 text-sm font-bold text-white/80">
                          {cardDate.stamp}
                        </div>
                      </div>

                      <div className="mb-2">
                        <h2 className="max-w-[14rem] text-[2rem] font-black leading-[0.95] tracking-[-0.06em]">
                          {displayTitle}
                        </h2>
                        {displayMeta && (
                          <p className="mt-2 text-base text-white/80">
                            {displayMeta}
                          </p>
                        )}
                      </div>
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
