import type { GeneratedSleepcast, SleepcastStatus, SleepcastTheme } from '../../types';
import type { Story } from '../../data/stories';

export interface SleepcastScreenProps {
  status: SleepcastStatus;
  currentCast: GeneratedSleepcast | null;
  currentTheme: SleepcastTheme | null;
  activeParagraph: number;
  error: string | null;
  catalogStories: Story[];
  onStartMockStory: (story: Story) => void;
  onTogglePlay: () => void;
  onStop: () => void;
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
