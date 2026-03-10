import { useCallback } from 'react';
import { motion } from 'motion/react';
import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../types';
import type { Story } from '../data/stories';
import { useTranslation } from '../i18n';
import { getStoryCast, getStoryTheme } from '../data/stories';
import { getThemeName } from './sleepcast/utils';
import { formatTime } from '../utils/time';
import { PlayerScreen } from './PlayerScreen';

interface SleepcastPlayerProps {
  cast: GeneratedSleepcast;
  theme: SleepcastTheme;
  status: SleepcastStatus;
  audioCurrentTime: number;
  audioDuration: number;
  catalogStories: Story[];
  timerMinutes: number | null;
  timerSecondsRemaining: number;
  onTogglePlay: () => void;
  onBack: () => void;
  onSetTimer: (minutes: number | null) => void;
  onPlayStory: (story: Story) => void;
  formatTimerDisplay: (seconds: number) => string;
}

export function SleepcastPlayer({
  cast,
  theme,
  status,
  audioCurrentTime,
  audioDuration,
  catalogStories,
  timerMinutes,
  timerSecondsRemaining,
  onTogglePlay,
  onBack,
  onSetTimer,
  onPlayStory,
  formatTimerDisplay,
}: SleepcastPlayerProps) {
  const { t } = useTranslation();

  const audioProgress = audioDuration > 0
    ? (audioCurrentTime / audioDuration) * 100
    : 0;

  const matchingStory = catalogStories.find((s) => s.id === cast.id);
  const currentStoryIdx = catalogStories.findIndex((s) => s.id === cast.id);

  const virtualTrack = {
    id: `sleepcast-${theme.id}`,
    title: cast.title,
    artist: matchingStory?.subtitle ?? getThemeName(t, theme),
    duration: '',
    category: 'sleepcast',
    imageUrl: theme.imageUrl,
    audioUrl: '',
  };

  const handleSkipNext = useCallback(() => {
    const idx = (currentStoryIdx + 1) % catalogStories.length;
    const story = catalogStories[idx];
    if (story) onPlayStory(story);
  }, [currentStoryIdx, catalogStories, onPlayStory]);

  const handleSkipPrev = useCallback(() => {
    const idx = (currentStoryIdx - 1 + catalogStories.length) % catalogStories.length;
    const story = catalogStories[idx];
    if (story) onPlayStory(story);
  }, [currentStoryIdx, catalogStories, onPlayStory]);

  return (
    <motion.div
      key="sleepcast-player-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-30"
    >
      <PlayerScreen
        track={virtualTrack}
        isPlaying={status === 'playing'}
        progress={Math.min(audioProgress, 100)}
        currentTime={formatTime(audioCurrentTime)}
        duration={audioDuration > 0 ? formatTime(audioDuration) : '--:--'}
        timerMinutes={timerMinutes}
        timerSecondsRemaining={timerSecondsRemaining}
        onTogglePlay={onTogglePlay}
        onBack={onBack}
        onSetTimer={onSetTimer}
        onSkipNext={handleSkipNext}
        onSkipPrev={handleSkipPrev}
        formatTimerDisplay={formatTimerDisplay}
        sleepcastMode={{
          headerLabel: status === 'playing' ? t('sleepcastPlaying') : t('sleepcastPaused'),
        }}
      />
    </motion.div>
  );
}
