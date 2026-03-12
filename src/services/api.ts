import type { Track } from '../types';
import type { StoryCategory } from '../data/stories';

// dev → local server; prod build (iOS + GitHub Pages) → online server
const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_SERVER_URL || 'https://sound-pillow-emdgctephrfpbcf3.southeastasia-01.azurewebsites.net');

export interface StoryCatalogItem {
  id: string;
  title: string;
  artist: string;
  subtitle: string;
  duration: string;
  imageUrl: string;
  imageSourceUrl: string;
  audioUrl: string;
  description: string;
  category: string;
  storyPreview: string;
  paragraphCount: number;
  backgroundMusic: string | undefined;
  isTrending?: boolean;
  isTodaysPick?: boolean;
}

export interface StoryCatalogResponse {
  categories: StoryCategory[];
  stories: StoryCatalogItem[];
}

export async function fetchStoryCatalog(locale: string = 'zh'): Promise<StoryCatalogResponse> {
  const res = await fetch(`${SERVER_URL}/api/stories?locale=${locale}`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export async function fetchAudios(): Promise<Track[]> {
  const res = await fetch(`${SERVER_URL}/api/audios`, {
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * Generate an uplifting mood message via the server's LLM endpoint.
 * Falls back to null on error — callers should use a local fallback.
 */
export async function fetchMoodMessage(mood: string, locale: string = 'en'): Promise<string | null> {
  try {
    const res = await fetch(`${SERVER_URL}/api/mood/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, locale }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { message?: string };
    return data.message ?? null;
  } catch {
    return null;
  }
}
