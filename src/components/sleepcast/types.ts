import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../../types';
import type { MockStory } from '../../data/mockStories';

export interface SleepcastScreenProps {
  status: SleepcastStatus;
  currentCast: GeneratedSleepcast | null;
  currentTheme: SleepcastTheme | null;
  activeParagraph: number;
  error: string | null;
  isConfigured: boolean;
  dailyStories: GeneratedSleepcast[];
  storiesLoading: boolean;
  onStartSleepcast: (theme: SleepcastTheme) => void;
  onStartMockStory: (story: MockStory) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onRetry?: () => void;
}

export interface SceneVisual {
  accent: string;
  rim: string;
  halo: string;
  haze: string;
  shadow: string;
  card: string;
  cardInk: string;
  sticker: string;
  stickerInk: string;
}

export type ThemeFilter = 'all' | 'ready' | 'generate' | 'offline';
