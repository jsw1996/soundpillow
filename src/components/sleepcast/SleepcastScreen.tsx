import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SLEEPCAST_THEMES } from '../../data/sleepcastThemes';
import { useTranslation } from '../../i18n';
import { ErrorView } from './ErrorView';
import { LoadingView } from './LoadingView';
import { PlaybackView } from './PlaybackView';
import { ThemeGrid } from './ThemeGrid';
import type { SleepcastScreenProps } from './types';

export function SleepcastScreen({
  status,
  currentCast,
  currentTheme,
  activeParagraph,
  error,
  isConfigured,
  dailyStories,
  storiesLoading,
  onStartSleepcast,
  onStartMockStory,
  onTogglePlay,
  onStop,
  onRetry,
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

      {(status === 'playing' || status === 'paused') && currentCast && currentTheme && (
        <motion.div
          key="playback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 flex flex-col"
        >
          <PlaybackView
            cast={currentCast}
            theme={currentTheme}
            activeParagraph={activeParagraph}
            status={status}
            onTogglePlay={onTogglePlay}
            onStop={onStop}
          />
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

      {(status === 'idle' || status === 'ready') && (
        <ThemeGrid
          key="grid"
          onSelect={onStartSleepcast}
          onStartMockStory={onStartMockStory}
          isConfigured={isConfigured}
          dailyStories={dailyStories}
          storiesLoading={storiesLoading}
          onRetry={onRetry}
        />
      )}
    </AnimatePresence>
  );
}
