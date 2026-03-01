/** Shared types between server and client */

export interface SleepcastTheme {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  imageUrl: string;
  bgTrackIds: string[];
}

export interface GeneratedSleepcast {
  id: string;
  themeId: string;
  title: string;
  story: string;
  paragraphs: string[];
  audioUrls?: string[];  // pre-generated TTS audio URLs per paragraph
  createdAt: number;
}

/** All stories for a single day, organized by theme → locale */
export interface DailyStories {
  date: string; // "2026-03-01"
  generatedAt: number;
  stories: Record<string, Record<string, GeneratedSleepcast>>;
  // stories[themeId][locale] = GeneratedSleepcast
}
