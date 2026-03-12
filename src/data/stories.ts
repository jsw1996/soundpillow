import type { GeneratedSleepcast, SleepcastTheme } from '../types';

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
  category: string;
  backgroundMusic: string | undefined;
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
  return {
    id: story.id,
    name: story.title,
    icon: 'BookOpen',
    prompt: '',
    imageUrl: story.imageUrl,
    backgroundMusic: story.backgroundMusic,
    bgTrackIds: [],
  };
}

export function getStoryCast(story: Story): GeneratedSleepcast {
  const resolvedAudioUrl = story.audioUrl ?? story.blobAudioPath ?? '';
  return {
    id: story.id,
    title: story.title,
    story: story.storyPreview,
    paragraphs: [story.storyPreview],
    audioUrls: resolvedAudioUrl ? [resolvedAudioUrl] : [],
    createdAt: Date.now(),
  };
}
