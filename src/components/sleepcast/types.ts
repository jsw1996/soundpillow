import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../../types';

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
