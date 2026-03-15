import type { Track } from '../types';
import type { StoryCategory } from '../data/stories';

// dev → local server; prod build (iOS + GitHub Pages) → online server
const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_SERVER_URL || 'https://sound-pillow-emdgctephrfpbcf3.southeastasia-01.azurewebsites.net');

function normalizeRequestError(error: unknown, timeoutMs: number): Error {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error(`Request timeout after ${timeoutMs}ms`);
  }

  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string' && error.trim()) {
    return new Error(error);
  }

  return new Error('Network request failed');
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    throw normalizeRequestError(error, timeoutMs);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

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
  const res = await fetchWithTimeout(
    `${SERVER_URL}/api/stories?locale=${encodeURIComponent(locale)}`,
    {},
    8000,
  );
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export async function fetchAudios(): Promise<Track[]> {
  const res = await fetchWithTimeout(`${SERVER_URL}/api/audios`, {}, 5000);
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
    const res = await fetchWithTimeout(
      `${SERVER_URL}/api/mood/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, locale }),
      },
      12000,
    );
    if (!res.ok) return null;
    const data = await res.json() as { message?: string };
    return data.message ?? null;
  } catch {
    return null;
  }
}
