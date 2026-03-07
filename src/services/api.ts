import type { GeneratedSleepcast, Track } from '../types';

// dev → local server; prod build (iOS + GitHub Pages) → online server
const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_SERVER_URL || 'https://sound-pillow-emdgctephrfpbcf3.southeastasia-01.azurewebsites.net');

/** Resolve a relative audio URL (e.g. /api/audio/...) to the full server URL */
export function resolveAudioUrl(relativeUrl: string): string {
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${SERVER_URL}${relativeUrl}`;
}

export interface DailyStoriesResponse {
  date: string;
  locale: string;
  stories: GeneratedSleepcast[];
  stale?: boolean;
  requestedDate?: string;
}

export async function fetchAudios(): Promise<Track[]> {
  const res = await fetch(`${SERVER_URL}/api/audios`);
  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }
  return res.json();
}

async function fetchStoriesForDate(date: string, locale: string): Promise<DailyStoriesResponse> {
  const res = await fetch(`${SERVER_URL}/api/stories/${date}?locale=${locale}`);
  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }
  return res.json();
}

async function fetchAvailableStoryDates(): Promise<string[]> {
  const res = await fetch(`${SERVER_URL}/api/stories/dates`);
  if (!res.ok) return [];

  const data = await res.json() as { dates?: string[] };
  return data.dates ?? [];
}

/**
 * Fetch today's pre-generated stories from the server.
 */
export async function fetchTodayStories(locale: string = 'en'): Promise<DailyStoriesResponse> {
  const res = await fetch(`${SERVER_URL}/api/stories/today?locale=${locale}`);
  if (res.ok) {
    return res.json();
  }

  if (res.status === 404) {
    const dates = await fetchAvailableStoryDates();
    if (dates.length > 0) {
      try {
        const fallback = await fetchStoriesForDate(dates[0], locale);
        return { ...fallback, stale: true, requestedDate: new Date().toISOString().slice(0, 10) };
      } catch {
        // Fall through to empty response below.
      }
    }

    return { date: new Date().toISOString().slice(0, 10), locale, stories: [] };
  }

  throw new Error(`Server error: ${res.status}`);
}

/**
 * Check if the server is reachable, with retries.
 * Retries up to `retries` times with increasing delays (1s, 2s, ...).
 * Timeout per attempt is 5s to account for iOS cold-start network latency.
 */
export async function checkServerHealth(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${SERVER_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return true;
    } catch {
      // network error or timeout — will retry
    }
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // 1s, 2s
    }
  }
  return false;
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

/**
 * Convert text to speech via the server's Azure Speech endpoint.
 * Returns an audio Blob (mp3).
 */
export async function fetchTts(text: string, locale: string = 'en'): Promise<Blob> {
  const res = await fetch(`${SERVER_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, locale }),
  });
  if (!res.ok) {
    throw new Error(`TTS error: ${res.status}`);
  }
  return res.blob();
}
