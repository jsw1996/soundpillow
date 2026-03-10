import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SLEEPCAST_THEMES } from '../../data/sleepcastThemes';
import { useTranslation } from '../../i18n';
import { ErrorView } from './ErrorView';
import { LoadingView } from './LoadingView';
import { ThemeGrid } from './ThemeGrid';
import type { SleepcastScreenProps } from './types';

export function SleepcastScreen({
  status,
  currentCast,
  currentTheme,
  error,
  catalogStories,
  onStartMockStory,
  onStop,
}: SleepcastScreenProps) {
  const { t } = useTranslation();
  const fallbackTheme = currentTheme ?? SLEEPCAST_THEMES[0];

  return (
    <AnimatePresence mode="wait">
      {status === 'generating' && currentTheme && !currentCast && (
        <motion.div
          key="generating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col"
        >
          <LoadingView theme={currentTheme} />
        </motion.div>
      )}

      {status === 'error' && (
        <ErrorView
          key="error"
          theme={fallbackTheme}
          message={error || t('sleepcastError')}
          onStop={onStop}
        />
      )}

      {status !== 'generating' && status !== 'error' && (
        <ThemeGrid
          key="grid"
          onStartMockStory={onStartMockStory}
          catalogStories={catalogStories}
        />
      )}
    </AnimatePresence>
  );
}
