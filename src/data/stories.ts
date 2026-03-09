import type { GeneratedSleepcast, SleepcastTheme } from '../types';
import { SLEEPCAST_THEMES } from './sleepcastThemes';

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
  category: string;
  themeId: SleepcastTheme['id'];
  audioUrl?: string;       // resolved URL from server
  blobAudioPath?: string;  // local fallback blob path
  paragraphCount: number;
  storyPreview: string;
  isTrending?: boolean;
  isTodaysPick?: boolean;
}

export interface StoryCategory {
  id: string;
  label: string;
}

export const STORY_CATEGORIES: StoryCategory[] = [
  { id: 'all', label: '全部' },
  { id: 'fairy-tale', label: '童话故事' },
  { id: 'animal-friends', label: '动物伙伴' },
  { id: 'city-life', label: '都市生活' },
];

export function getStoryTheme(story: Story): SleepcastTheme {
  const baseTheme = SLEEPCAST_THEMES.find((theme) => theme.id === story.themeId) ?? SLEEPCAST_THEMES[0];
  return {
    ...baseTheme,
    imageUrl: story.imageUrl,
  };
}

export function getStoryCast(story: Story): GeneratedSleepcast {
  const resolvedAudioUrl = story.audioUrl ?? story.blobAudioPath ?? '';
  return {
    id: story.id,
    themeId: story.themeId,
    title: story.title,
    story: story.storyPreview,
    paragraphs: [story.storyPreview],
    audioUrls: resolvedAudioUrl ? [resolvedAudioUrl] : [],
    createdAt: Date.now(),
  };
}
