import type { GeneratedSleepcast } from '../types';

const useLocalServer = new URLSearchParams(window.location.search).get('testLocal') === 'true';
const SERVER_URL = useLocalServer ? 'http://localhost:3001' : (import.meta.env.VITE_SERVER_URL || '');

/** Resolve a relative audio URL (e.g. /api/audio/...) to the full server URL */
export function resolveAudioUrl(relativeUrl: string): string {
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${SERVER_URL}${relativeUrl}`;
}

export interface DailyStoriesResponse {
  date: string;
  locale: string;
  stories: GeneratedSleepcast[];
}

/**
 * Fetch today's pre-generated stories from the server.
 */
export async function fetchTodayStories(locale: string = 'en'): Promise<DailyStoriesResponse> {
  const res = await fetch(`${SERVER_URL}/api/stories/today?locale=${locale}`);
  if (!res.ok) {
    if (res.status === 404) {
      return { date: new Date().toISOString().slice(0, 10), locale, stories: [] };
    }
    throw new Error(`Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * Check if the server is reachable.
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
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
